'use client';

import { ChatInterface } from '@/components/chat-interface';

export default function MirrorPage() {
  return (
    <div className="flex flex-col h-[100dvh] md:h-[calc(100dvh-4rem)]">
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="w-full px-6 lg:px-12 py-3">
          <h1 className="text-2xl font-bold text-gray-900">Amika Chat</h1>
          <p className="text-sm text-gray-600">Your relationship coach</p>
        </div>
      </div>
      <div className="flex-1 overflow-hidden w-full px-6 lg:px-12 py-6">
        <ChatInterface />
      </div>
    </div>
  );
}
