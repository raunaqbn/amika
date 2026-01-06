'use client';

import { ChatInterface } from '@/components/chat-interface';

export default function MirrorPage() {
  return (
    <div className="flex flex-col h-screen md:h-[calc(100vh-4rem)]">
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">Amika Chat</h1>
          <p className="text-sm text-gray-600">Your relationship coach</p>
        </div>
      </div>
      <div className="flex-1 overflow-hidden max-w-6xl mx-auto w-full px-4 py-4 lg:px-8">
        <ChatInterface />
      </div>
    </div>
  );
}
