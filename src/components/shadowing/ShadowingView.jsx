import { useParams } from 'react-router-dom';

export default function ShadowingView() {
  const { textId } = useParams();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center text-gray-400">
        <p className="text-lg">Shadow reading — coming soon</p>
        <p className="text-sm mt-2">Audio playback with synchronized word highlighting and student recording</p>
        {textId && <p className="text-xs mt-1 text-gray-300">Text: {textId}</p>}
      </div>
    </div>
  );
}
