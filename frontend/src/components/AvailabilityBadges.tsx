import React, { useState } from 'react';
import type { AvailabilityInfo } from '../apis/clubs';

interface AvailabilityBadgesProps {
  availabilities: AvailabilityInfo[];
  className?: string;
}

const AvailabilityBadges: React.FC<AvailabilityBadgesProps> = ({
  availabilities,
  className = ''
}) => {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  // 요일 매핑 (0: 일요일 ~ 6: 토요일)
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const dayColors = [
    'bg-red-100 text-red-600 border-red-200',      // 일
    'bg-blue-100 text-blue-600 border-blue-200',   // 월
    'bg-green-100 text-green-600 border-green-200', // 화
    'bg-orange-100 text-orange-600 border-orange-200', // 수
    'bg-purple-100 text-purple-600 border-purple-200', // 목
    'bg-pink-100 text-pink-600 border-pink-200',   // 금
    'bg-indigo-100 text-indigo-600 border-indigo-200' // 토
  ];

  // 시간 포맷팅 함수 (HH:mm 형태로)
  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5); // "09:00:00" -> "09:00"
  };

  // 활동 가능한 요일들을 dayOfWeek 기준으로 그룹화
  const availabilityByDay = availabilities.reduce((acc, availability) => {
    const day = availability.dayOfWeek;
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(availability);
    return acc;
  }, {} as Record<number, AvailabilityInfo[]>);

  // 활동 가능한 요일들만 정렬해서 표시
  const availableDays = Object.keys(availabilityByDay)
    .map(Number)
    .sort((a, b) => a - b);

  if (availabilities.length === 0) {
    return (
      <div className={`flex items-center ${className}`}>
        <span className="text-xs text-gray-400">시간 미설정</span>
      </div>
    );
  }

  return (
    <div className={`relative flex items-center gap-1 ${className}`}>
      {availableDays.map((dayOfWeek) => {
        const dayAvailabilities = availabilityByDay[dayOfWeek];
        const isHovered = hoveredDay === dayOfWeek;

        return (
          <div key={dayOfWeek} className="relative">
            <span
              className={`
                inline-block px-2 py-1 text-xs font-medium rounded-full border
                cursor-pointer transition-all duration-200 transform hover:scale-110
                ${dayColors[dayOfWeek]}
                ${isHovered ? 'shadow-md z-10' : 'shadow-sm'}
              `}
              onMouseEnter={() => setHoveredDay(dayOfWeek)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              {dayNames[dayOfWeek]}
            </span>

            {/* 툴팁 */}
            {isHovered && (
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 z-20">
                <div className="bg-gray-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg min-w-max">
                  <div className="font-medium mb-1">{dayNames[dayOfWeek]}요일 가능 시간</div>
                  {dayAvailabilities.map((availability, index) => (
                    <div key={index} className="text-gray-200">
                      {formatTime(availability.startTime)} - {formatTime(availability.endTime)}
                    </div>
                  ))}
                  {/* 툴팁 화살표 */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2">
                    <div className="w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-800"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AvailabilityBadges;