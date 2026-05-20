import { useState } from 'react';

export default function ReadingView() {
  const [textContent, setTextContent] = useState('');

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="text-center text-gray-400 py-16">
        <p className="text-lg">Reading view — coming soon</p>
        <p className="text-sm mt-2">Text display with word highlighting, click-to-lookup, and vocabulary tracking</p>
      </div>
    </div>
  );
}
