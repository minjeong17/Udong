import React, { useState } from "react";
import Header from "../components/Header";
import { ClubApi } from "../apis/clubs";
import type { ClubCreateRequest } from "../apis/clubs";

interface ClubCreationProps {
  onNavigateToOnboarding: () => void;
  onNavigateToClubSelection?: () => void;
  onCreateClub?: (clubData: ClubData) => void;
  currentRoute?: string;
}

interface ClubData {
  name: string;
  description: string;
  category: string;
  accountNumber: string;
}

const ClubCreation: React.FC<ClubCreationProps> = ({
  onNavigateToOnboarding,
  onNavigateToClubSelection,
  onCreateClub,
  currentRoute,
}) => {
  const [formData, setFormData] = useState<ClubData>({
    name: "",
    description: "",
    category: "",
    accountNumber: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const clubData: ClubCreateRequest = {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        accountNumber: formData.accountNumber,
      };

      console.log(clubData);

      const createdClub = await ClubApi.create(clubData);

      alert("동아리가 성공적으로 생성되었습니다! 🎉");
      console.log("Club created:", createdClub);

      if (onCreateClub) {
        onCreateClub(formData);
      }
    } catch (error) {
      console.error("Club creation failed:", error);
      if (error instanceof Error) {
        if (error.message.includes("이미 존재")) {
          setError("동일한 이름의 동아리가 이미 존재합니다.");
        } else if (error.message.includes("계좌번호")) {
          setError("계좌번호 형식이 올바르지 않습니다.");
        } else if (error.message.includes("UNAUTHORIZED")) {
          setError("로그인이 필요합니다.");
        } else {
          setError("동아리 생성에 실패했습니다. 다시 시도해주세요.");
        }
      } else {
        setError("동아리 생성에 실패했습니다. 다시 시도해주세요.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    { value: "", label: "카테고리를 선택해주세요" },
    { value: "sports", label: "운동/스포츠" },
    { value: "hobby", label: "취미/여가" },
    { value: "study", label: "학습/스터디" },
    { value: "volunteer", label: "봉사/사회활동" },
    { value: "culture", label: "문화/예술" },
    { value: "technology", label: "기술/IT" },
    { value: "language", label: "언어/외국어" },
    { value: "other", label: "기타" },
  ];

  return (
    <div className="min-h-screen bg-[#fcf9f5] relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Drifting circles with gentle movement */}
        <div className="absolute top-32 left-8 w-24 h-24 bg-orange-200 rounded-full opacity-8 animate-drift"></div>
        <div className="absolute top-16 right-16 w-20 h-20 bg-orange-300 rounded-full opacity-10 animate-drift-reverse"></div>
        <div className="absolute bottom-24 left-24 w-16 h-16 bg-orange-400 rounded-full opacity-12 animate-drift"></div>
        <div className="absolute bottom-40 right-12 w-18 h-18 bg-orange-200 rounded-full opacity-8 animate-drift-reverse"></div>

        {/* Additional drifting elements */}
        <div className="absolute top-1/3 left-1/4 w-32 h-32 bg-gradient-to-br from-orange-200 to-orange-300 rounded-full opacity-6 animate-drift"></div>
        <div className="absolute bottom-1/3 right-1/4 w-28 h-28 bg-gradient-to-br from-orange-300 to-orange-400 rounded-full opacity-8 animate-drift-reverse"></div>
        <div className="absolute top-1/2 left-10 w-14 h-14 bg-orange-300 rounded-full opacity-10 animate-drift"></div>
        <div className="absolute top-3/4 right-20 w-12 h-12 bg-orange-200 rounded-full opacity-8 animate-drift-reverse"></div>

        {/* Extra floating circles */}
        <div className="absolute top-2/3 left-1/3 w-20 h-20 bg-orange-200 rounded-full opacity-7 animate-drift"></div>
        <div className="absolute top-1/4 right-1/3 w-16 h-16 bg-orange-300 rounded-full opacity-9 animate-drift-reverse"></div>
        <div className="absolute bottom-1/2 left-20 w-22 h-22 bg-orange-400 rounded-full opacity-8 animate-drift"></div>
      </div>

      <Header
        onNavigateToOnboarding={onNavigateToOnboarding}
        onBackClick={onNavigateToClubSelection}
        currentRoute={currentRoute}
      />

      {/* Main Content */}
      <div className="min-h-screen flex flex-col lg:flex-row items-center relative z-20 py-8 pt-24">
        {/* Left Side - Title and Mascot */}
        <div className="w-full lg:w-1/2 px-8 lg:pl-16 lg:pr-8 mb-20 lg:mb- flex flex-col justify-start h-full">
          {/* Title Section */}
          <div className="text-center lg:text-left pt-0 lg:pt-0">
            <h1 className="text-3xl lg:text-4xl font-semibold mb-4 font-jua leading-relaxed text-black-500">
              <span className="text-orange-500">동아리를&nbsp;</span>
              만들어보세요
            </h1>
            <p className="text-gray-600 text-base lg:text-lg font-gowun">
              동아리 정보를 입력하면{" "}
              <span className="text-orange-500 font-medium">AI</span>가{" "}
              <span className="text-lime-500 font-medium">마스코트</span>를
              생성해드려요
            </p>
          </div>

          {/* Mascot Section */}
          <div className="flex items-center justify-center mt-8 lg:mt-12">
            <div className="relative">
              <img
                src="/images/clubCreation.png"
                alt="우동 마스코트"
                className="w-64 lg:w-72 h-auto object-contain animate-mascot-wiggle"
              />
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 px-8 lg:pr-16 lg:pl-8">
          <div className="bg-white rounded-3xl shadow-lg border-2 border-orange-100 p-6 lg:p-10 w-full max-w-2xl mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-700 mb-2 font-jua">
                동아리 정보
              </h2>
              <p className="text-gray-500 text-sm font-gowun">
                기본적인 동아리 정보를 입력해주세요
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Club Name */}
              <div>
                <label className="block text-gray-700 text-sm mb-3 font-gowun font-medium">
                  동아리명
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-4 bg-white border-2 border-gray-200 rounded-xl text-gray-600 font-gowun focus:outline-none focus:border-orange-300 placeholder-gray-400 text-base"
                  placeholder="동아리 이름을 입력해주세요"
                  required
                />
              </div>

              {/* Club Description */}
              <div>
                <label className="block text-gray-700 text-sm mb-3 font-gowun font-medium">
                  동아리 소개
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={6}
                  className="w-full px-4 py-4 bg-white border-2 border-gray-200 rounded-xl text-gray-600 font-gowun focus:outline-none focus:border-orange-300 placeholder-gray-400 text-base resize-none"
                  placeholder="동아리에 대한 간단한 소개를 작성해주세요"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-gray-700 text-sm mb-3 font-gowun font-medium">
                  카테고리
                </label>
                <div className="relative">
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-4 bg-white border-2 border-gray-200 rounded-xl text-gray-600 font-gowun focus:outline-none focus:border-orange-300 text-base appearance-none cursor-pointer"
                    required
                  >
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Club Account Number */}
              <div>
                <label className="block text-gray-700 text-sm mb-3 font-gowun font-medium">
                  동아리 공용 계좌번호
                </label>
                <input
                  type="text"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleInputChange}
                  className="w-full px-4 py-4 bg-white border-2 border-gray-200 rounded-xl text-gray-600 font-gowun focus:outline-none focus:border-orange-300 placeholder-gray-400 text-base"
                  placeholder="계좌번호를 입력해주세요 (숫자만 입력)"
                  required
                />
                <p className="mt-2 text-xs text-gray-500 font-gowun">
                  동아리 회비 관리를 위한 공용 계좌번호를 입력해주세요
                </p>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-red-600 text-sm font-gowun">{error}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={onNavigateToClubSelection}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium py-4 px-6 rounded-xl transition-colors border border-gray-200 font-gowun text-base"
                >
                  이전으로
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-4 px-6 rounded-xl transition-colors border border-orange-400 font-gowun text-base"
                >
                  {isLoading ? "생성 중..." : "동아리 생성하기"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClubCreation;
