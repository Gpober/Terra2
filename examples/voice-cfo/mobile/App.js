import React, { useState } from "react";
import { Button, View } from "react-native";
import { Audio } from "expo-av";
import { Buffer } from "buffer";

export default function App() {
  const [recording, setRecording] = useState(null);

  const startRecording = async () => {
    await Audio.requestPermissionsAsync();
    const rec = new Audio.Recording();
    await rec.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
    await rec.startAsync();
    setRecording(rec);
  };

  const stopAndSend = async () => {
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);

    const formData = new FormData();
    formData.append("audio", {
      uri,
      name: "query.wav",
      type: "audio/wav",
    });

    const res = await fetch("http://YOUR_SERVER_IP:8000/ask-cfo", {
      method: "POST",
      body: formData,
    });
    const arrayBuffer = await res.arrayBuffer();
    const soundObj = await Audio.Sound.createAsync({
      uri: `data:audio/mp3;base64,${Buffer.from(arrayBuffer).toString("base64")}`,
    });
    soundObj.sound.playAsync();
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Button
        title={recording ? "Stop & Send" : "Record"}
        onPress={recording ? stopAndSend : startRecording}
      />
    </View>
  );
}
