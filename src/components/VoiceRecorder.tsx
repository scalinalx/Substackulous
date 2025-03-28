'use client';

import { useState, useRef, useEffect } from 'react';
import { useDeepgram } from '../lib/contexts/DeepgramContext';
import { supabase } from '@/lib/supabase/clients';
import { motion } from 'framer-motion';

export default function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const { connectToDeepgram, disconnectFromDeepgram, connectionState, realtimeTranscript } = useDeepgram();

  const handleStartRecording = async () => {
    await connectToDeepgram();
    setIsRecording(true);
  };

  const handleStopRecording = async () => {
    disconnectFromDeepgram();
    setIsRecording(false);
    
    // Save the note to Supabase
    if (realtimeTranscript) {
      const { data, error } = await supabase
        .from('notes')
        .insert([
          {
            text: realtimeTranscript,
            timestamp: new Date().toISOString(),
          },
        ]);
    }
  };

  const uploadToStorage = async (blob: Blob) => {
    try {
      const { data, error } = await supabase
        .storage
        .from('audio-uploads')
        .upload(`recording-${Date.now()}.webm`, blob);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error uploading audio:', error);
      throw error;
    }
  };

  return (
    <div className="w-full max-w-md">
      <button
        onClick={isRecording ? handleStopRecording : handleStartRecording}
        className={`w-full py-2 px-4 rounded-full ${
          isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
        } text-white font-bold`}
      >
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>
      {isRecording && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="w-8 h-8 bg-blue-500 rounded-full mx-auto mb-4"
          />
          <p className="text-sm text-gray-600">{realtimeTranscript}</p>
        </div>
      )}
    </div>
  );
}