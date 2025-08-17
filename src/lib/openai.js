// We avoid using the official OpenAI SDK to reduce build dependencies.
// Instead, interact with the OpenAI REST API directly via fetch.
// This keeps Vercel/Next.js builds lightweight and prevents "module not found" errors
// when the `openai` package isn't installed.
import { availableFunctions } from '../app/api/ai-chat-mobile/route'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable')
}

/**
 * Helper to call OpenAI's Chat Completions endpoint.
 * Mirrors `openai.chat.completions.create` from the official SDK.
 */
async function createChatCompletion(body) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`OpenAI API error ${res.status}: ${errorText}`)
  }

  return res.json()
}

export const createCFOCompletion = async (message, context) => {
  try {
    // Determine if we need function calling based on query type
    const needsFunctionCalling = [
      'ar_analysis',
      'customer_analysis', 
      'financial_analysis',
      'performance_analysis',
      'trend_analysis'  // Added for year-over-year comparisons
    ].includes(context.queryType)

    let messages = [
      {
        role: "system",
        content: `You are an AI CFO assistant for I AM CFO platform. 
        You analyze financial data and provide actionable insights for business owners.
        
        Current context:
        - Platform: ${context.platform}
        - Query Type: ${context.queryType}
        - User Type: ${context.userType}
        - Business: Multi-unit property management and service businesses
        
        Your personality:
        - Direct and insightful ("Man Behind the Curtain")
        - Focus on actionable recommendations
        - Use real data when available via functions
        - Professional but approachable tone
        - Always end with "More than just a balance sheet" when relevant
        
        When you have access to real data via functions, prioritize that over general advice.
        Always cite specific numbers and provide concrete recommendations.`
      },
      {
        role: "user",
        content: message
      }
    ]

    let completionOptions = {
      model: "gpt-4",
      messages: messages,
      temperature: 0.3,
      max_tokens: 500
    }

    // Add function calling if needed - CORRECTED for single user per DB
    if (needsFunctionCalling) {
      completionOptions.tools = [
        {
          type: "function",
          function: {
            name: "getARAgingAnalysis",
            description: "Get accounts receivable aging analysis showing current, 30, 60, 90+ day buckets by customer",
            parameters: {
              type: "object",
              properties: {
                customerId: {
                  type: "string",
                  description: "Optional specific customer ID to analyze"
                }
              },
              required: []  // ← CHANGED: No required parameters (removed userId requirement)
            }
          }
        },
        {
          type: "function",
          function: {
            name: "getARPaymentHistory",
            description: "Get accounts receivable payment history and collection patterns by customer",
            parameters: {
              type: "object",
              properties: {
                customerId: {
                  type: "string",
                  description: "Optional specific customer ID to analyze"
                },
                timeframe: {
                  type: "string",
                  enum: ["3_months", "6_months", "12_months"],
                  description: "Time period for payment history analysis"
                }
              },
              required: []  // ← CHANGED: No required parameters (removed userId requirement)
            }
          }
        },
        {
          type: "function",
          function: {
            name: "getCustomerNetIncome",
            description: "Get customer profitability analysis showing revenue, expenses, and net income by customer",
            parameters: {
              type: "object",
              properties: {
                customerId: {
                  type: "string",
                  description: "Optional specific customer ID to analyze"
                },
                timeframe: {
                  type: "string",
                  enum: ["current_month", "last_month", "current_quarter", "last_quarter"],
                  description: "Time period for financial analysis"
                }
              },
              required: []  // ← CHANGED: No required parameters (removed userId requirement)
            }
          }
        },
        {
          type: "function",
          function: {
            name: "getYearOverYearComparison",
            description: "Compare current year performance vs last year including revenue, expenses, customer growth, and trends",
            parameters: {
              type: "object",
              properties: {
                customerId: {
                  type: "string",
                  description: "Optional specific customer ID to compare"
                },
                metric: {
                  type: "string",
                  enum: ["all", "revenue", "expenses", "customers", "profit"],
                  description: "Specific metric to focus comparison on"
                }
              },
              required: []  // ← CHANGED: No required parameters (removed userId requirement)
            }
          }
        }
      ]
      
      completionOptions.tool_choice = "auto"
    }

    console.log('🤖 OpenAI Request:', { 
      query: message, 
      functions: needsFunctionCalling,
      queryType: context.queryType 
    })

    // First API call to OpenAI
    const completion = await createChatCompletion(completionOptions)
    
    let finalResponse = completion.choices[0].message

    // Handle function calls
    if (finalResponse.tool_calls) {
      console.log('🔧 Function calls needed:', finalResponse.tool_calls.length)
      
      // Add the assistant's message to conversation
      messages.push(finalResponse)
      
      // Execute each function call
      for (const toolCall of finalResponse.tool_calls) {
        const functionName = toolCall.function.name
        const functionArgs = JSON.parse(toolCall.function.arguments)
        
        // ← REMOVED: userId injection logic (not needed for single user per DB)
        // The functions no longer need or expect userId parameter
        
        console.log(`📊 Calling function: ${functionName}`, functionArgs)
        
        // Execute the function
        let functionResult
        try {
          if (availableFunctions[functionName]) {
            functionResult = await availableFunctions[functionName](functionArgs)
          } else {
            functionResult = { error: `Function ${functionName} not found` }
          }
        } catch (error) {
          functionResult = { error: error.message }
        }
        
        console.log(`📈 Function result:`, functionResult)
        
        // Add function result to conversation
        messages.push({
          tool_call_id: toolCall.id,
          role: "tool",
          name: functionName,
          content: JSON.stringify(functionResult)
        })
      }
      
      // Second API call with function results
      const finalCompletion = await createChatCompletion({
        model: "gpt-4",
        messages: messages,
        temperature: 0.3,
        max_tokens: 800
      })
      
      finalResponse = finalCompletion.choices[0].message
    }

    console.log('✅ AI Response generated:', finalResponse.content?.substring(0, 100) + '...')
    
    return finalResponse.content

  } catch (error) {
    console.error('❌ OpenAI Error:', error)
    
    // Fallback response
    if (error.message?.includes('insufficient_quota')) {
      return "I'm temporarily unable to analyze your data due to API limits. Please try again in a moment."
    } else if (error.message?.includes('context_length_exceeded')) {
      return "Your query involves too much data. Please try asking about a specific customer or shorter time period."
    } else {
      return "I encountered an issue analyzing your financial data. Please try rephrasing your question or contact support if this persists."
    }
  }
}
