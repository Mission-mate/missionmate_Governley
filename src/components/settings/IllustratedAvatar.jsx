import React from 'react';

// Eight flat illustrated avatars. The source images have white padding around the
// illustrated circle, so we zoom in (~1.3x) to fill the circular frame edge-to-edge.
export const avatarOptions = [
  { value: 'https://media.base44.com/images/public/6a1f6f3befc81ba358040823/3877bece5_AVT1.png' },
  { value: 'https://media.base44.com/images/public/6a1f6f3befc81ba358040823/c9f333c7b_AVT2.png' },
  { value: 'https://media.base44.com/images/public/6a1f6f3befc81ba358040823/ef7729464_AVT3.png' },
  { value: 'https://media.base44.com/images/public/6a1f6f3befc81ba358040823/cc7e86d25_AVT4.png' },
  { value: 'https://media.base44.com/images/public/6a1f6f3befc81ba358040823/df3ddd595_ChatGPTImageAug19202606_18_24PM3.png' },
  { value: 'https://media.base44.com/images/public/6a1f6f3befc81ba358040823/26bae0f9c_ChatGPTImageAug19202606_18_23PM1.png' },
  { value: 'https://media.base44.com/images/public/6a1f6f3befc81ba358040823/54886a6aa_ChatGPTImageAug19202606_18_24PM2.png' },
  { value: 'https://media.base44.com/images/public/6a1f6f3befc81ba358040823/652e4cda8_ChatGPTImageAug19202606_18_24PM4.png' },
];

const isPresetAvatar = (value) => avatarOptions.some((option) => option.value === value);

export default function IllustratedAvatar({ value, className = '', priority = true }) {
  return (
    <img
      src={value}
      alt="profile"
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'low'}
      decoding="async"
      className={`h-full w-full object-cover ${isPresetAvatar(value) ? 'scale-[1.32]' : ''} ${className}`}
    />
  );
}