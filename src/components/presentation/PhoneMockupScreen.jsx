import React from 'react';

const APP_SCREENSHOTS = {
  home: 'https://media.base44.com/images/public/6a1659694bbc41636f640ae6/4be5abb2d_generated_image.png',
  matching: 'https://media.base44.com/images/public/6a1659694bbc41636f640ae6/4e63ccd69_generated_image.png',
  reader: 'https://media.base44.com/images/public/6a1659694bbc41636f640ae6/8b655b843_generated_image.png',
  discover: 'https://media.base44.com/images/public/6a1659694bbc41636f640ae6/192f37d98_generated_image.png',
  community: 'https://media.base44.com/images/public/6a1659694bbc41636f640ae6/9a86d455a_generated_image.png',
  profile: 'https://media.base44.com/images/public/6a1659694bbc41636f640ae6/0100cd524_generated_image.png',
};

export default function PhoneMockupScreen({ screenId, color }) {
  const src = APP_SCREENSHOTS[screenId];
  if (src) {
    return (
      <div className="w-full h-full overflow-hidden">
        <img
          src={src}
          alt={screenId}
          className="w-full h-full object-cover object-top"
        />
      </div>
    );
  }

  // fallback placeholder
  return (
    <div className="w-full h-full flex items-center justify-center text-white/30 text-xs">
      {screenId}
    </div>
  );
}