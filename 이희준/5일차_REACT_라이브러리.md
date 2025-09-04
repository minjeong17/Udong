# React 생태계 필수 라이브러리 완벽 가이드: 생산성을 10배 높이는 도구들

## 📌 들어가며

React만으로도 훌륭한 애플리케이션을 만들 수 있지만, 잘 만들어진 라이브러리들을 활용하면 개발 속도와 코드 품질을 획기적으로 향상시킬 수 있습니다.

"바퀴를 다시 발명하지 마라"라는 격언처럼, 이미 검증된 솔루션을 활용하는 것이 현명한 선택입니다.

이 글을 다 읽고 나면, 여러분은 어떤 상황에서 어떤 라이브러리를 선택해야 하는지 명확히 알게 될 것입니다!

---

## 🎯 라이브러리 선택 기준

### 좋은 라이브러리의 조건
- ✅ **활발한 유지보수**: 정기적인 업데이트와 버그 수정
- ✅ **충분한 문서화**: 명확한 가이드와 API 문서
- ✅ **커뮤니티 지원**: 활성화된 커뮤니티와 풍부한 예제
- ✅ **번들 크기**: 적절한 크기와 트리 쉐이킹 지원
- ✅ **TypeScript 지원**: 타입 정의 제공

---

## 🏪 Part 1: 상태 관리 (State Management)

### Zustand - 가장 간단한 상태 관리

**한 줄 정의**: Redux의 복잡함 없이 간단하게 전역 상태를 관리할 수 있는 라이브러리

#### 설치
```bash
npm install zustand
```

#### 기본 사용법
```typescript
// store/useStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AppState {
  // 상태
  user: User | null;
  theme: 'light' | 'dark';
  isLoading: boolean;
  
  // 액션
  setUser: (user: User | null) => void;
  toggleTheme: () => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

const useStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        // 초기 상태
        user: null,
        theme: 'light',
        isLoading: false,
        
        // 액션 구현
        setUser: (user) => set({ user }),
        toggleTheme: () => set((state) => ({ 
          theme: state.theme === 'light' ? 'dark' : 'light' 
        })),
        setLoading: (loading) => set({ isLoading: loading }),
        logout: () => set({ user: null })
      }),
      {
        name: 'app-storage', // localStorage 키
        partialize: (state) => ({ user: state.user, theme: state.theme }) // 저장할 상태 선택
      }
    )
  )
);

export default useStore;
```

#### 컴포넌트에서 사용
```tsx
// components/UserProfile.tsx
import useStore from '@/store/useStore';

function UserProfile() {
  // 필요한 상태만 구독
  const user = useStore((state) => state.user);
  const logout = useStore((state) => state.logout);
  
  if (!user) return <div>로그인이 필요합니다</div>;
  
  return (
    <div className="p-4">
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      <button onClick={logout}>로그아웃</button>
    </div>
  );
}

// 여러 상태 한번에 가져오기
function Header() {
  const { theme, toggleTheme, user } = useStore();
  
  return (
    <header className={theme === 'dark' ? 'bg-gray-900' : 'bg-white'}>
      <button onClick={toggleTheme}>테마 변경</button>
      {user && <span>환영합니다, {user.name}님!</span>}
    </header>
  );
}
```

### Jotai - 원자적 상태 관리

**한 줄 정의**: React의 useState처럼 사용하면서도 전역 상태를 관리할 수 있는 라이브러리

#### 설치
```bash
npm install jotai
```

#### 기본 사용법
```tsx
// atoms/index.ts
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// 기본 atom
export const countAtom = atom(0);

// localStorage와 연동
export const userAtom = atomWithStorage('user', null);

// 파생된 atom (computed)
export const doubleCountAtom = atom(
  (get) => get(countAtom) * 2
);

// 비동기 atom
export const fetchUserAtom = atom(async () => {
  const response = await fetch('/api/user');
  return response.json();
});
```

#### 컴포넌트에서 사용
```tsx
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { countAtom, doubleCountAtom } from '@/atoms';

function Counter() {
  // useState와 비슷한 API
  const [count, setCount] = useAtom(countAtom);
  
  // 읽기 전용
  const doubleCount = useAtomValue(doubleCountAtom);
  
  // 쓰기 전용
  const incrementCount = useSetAtom(countAtom);
  
  return (
    <div>
      <p>Count: {count}</p>
      <p>Double: {doubleCount}</p>
      <button onClick={() => setCount(c => c + 1)}>+1</button>
    </div>
  );
}
```

### Redux Toolkit - 엔터프라이즈 표준

**한 줄 정의**: Redux의 복잡함을 개선한 공식 도구 모음

#### 설치
```bash
npm install @reduxjs/toolkit react-redux
```

#### 기본 설정
```typescript
// store/slice/userSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// 비동기 액션
export const fetchUser = createAsyncThunk(
  'user/fetch',
  async (userId: string) => {
    const response = await fetch(`/api/users/${userId}`);
    return response.json();
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState: {
    data: null,
    loading: false,
    error: null
  },
  reducers: {
    logout: (state) => {
      state.data = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  }
});

export const { logout } = userSlice.actions;
export default userSlice.reducer;
```

---

## 📝 Part 2: 폼 관리 (Form Management)

### React Hook Form - 성능 최적화된 폼

**한 줄 정의**: 최소한의 리렌더링으로 복잡한 폼을 쉽게 관리하는 라이브러리

#### 설치
```bash
npm install react-hook-form
npm install @hookform/resolvers zod  # 유효성 검증용
```

#### 기본 사용법
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// 스키마 정의
const signupSchema = z.object({
  username: z.string()
    .min(3, '최소 3자 이상')
    .max(20, '최대 20자까지'),
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  password: z.string()
    .min(8, '최소 8자 이상')
    .regex(/[A-Z]/, '대문자 포함 필수')
    .regex(/[0-9]/, '숫자 포함 필수'),
  confirmPassword: z.string(),
  age: z.number()
    .min(14, '14세 이상만 가입 가능')
    .max(120, '올바른 나이를 입력하세요'),
  terms: z.boolean().refine(val => val === true, {
    message: '약관에 동의해야 합니다'
  })
}).refine(data => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['confirmPassword']
});

type SignupFormData = z.infer<typeof signupSchema>;

function SignupForm() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: '',
      email: '',
      age: 18,
      terms: false
    }
  });
  
  // 특정 필드 감시
  const watchPassword = watch('password');
  
  const onSubmit = async (data: SignupFormData) => {
    try {
      await fetch('/api/signup', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      alert('회원가입 성공!');
      reset();
    } catch (error) {
      alert('회원가입 실패');
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <input
          {...register('username')}
          placeholder="사용자명"
          className="input"
        />
        {errors.username && (
          <p className="text-red-500 text-sm">{errors.username.message}</p>
        )}
      </div>
      
      <div>
        <input
          {...register('email')}
          type="email"
          placeholder="이메일"
          className="input"
        />
        {errors.email && (
          <p className="text-red-500 text-sm">{errors.email.message}</p>
        )}
      </div>
      
      <div>
        <input
          {...register('password')}
          type="password"
          placeholder="비밀번호"
          className="input"
        />
        {errors.password && (
          <p className="text-red-500 text-sm">{errors.password.message}</p>
        )}
      </div>
      
      <div>
        <input
          {...register('confirmPassword')}
          type="password"
          placeholder="비밀번호 확인"
          className="input"
        />
        {errors.confirmPassword && (
          <p className="text-red-500 text-sm">{errors.confirmPassword.message}</p>
        )}
      </div>
      
      <div>
        <input
          {...register('age', { valueAsNumber: true })}
          type="number"
          placeholder="나이"
          className="input"
        />
        {errors.age && (
          <p className="text-red-500 text-sm">{errors.age.message}</p>
        )}
      </div>
      
      <div>
        <label className="flex items-center">
          <input
            {...register('terms')}
            type="checkbox"
            className="mr-2"
          />
          <span>약관에 동의합니다</span>
        </label>
        {errors.terms && (
          <p className="text-red-500 text-sm">{errors.terms.message}</p>
        )}
      </div>
      
      <button
        type="submit"
        disabled={isSubmitting}
        className="btn btn-primary"
      >
        {isSubmitting ? '처리중...' : '회원가입'}
      </button>
    </form>
  );
}
```

---

## 🔄 Part 3: 데이터 페칭 (Data Fetching)

### TanStack Query (React Query) - 서버 상태 관리의 정석

**한 줄 정의**: 서버 데이터를 캐싱, 동기화, 업데이트하는 강력한 데이터 페칭 라이브러리

#### 설치
```bash
npm install @tanstack/react-query
```

#### 기본 설정
```tsx
// main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,      // 1분
      cacheTime: 5 * 60 * 1000,   // 5분
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

#### 데이터 페칭
```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

// API 함수들
const fetchPosts = async ({ queryKey }: any) => {
  const [_, userId] = queryKey;
  const response = await fetch(`/api/posts?userId=${userId}`);
  if (!response.ok) throw new Error('Failed to fetch');
  return response.json();
};

const createPost = async (newPost: any) => {
  const response = await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newPost)
  });
  if (!response.ok) throw new Error('Failed to create');
  return response.json();
};

function PostList({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  
  // 데이터 조회
  const {
    data: posts,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['posts', userId],
    queryFn: fetchPosts,
    enabled: !!userId, // userId가 있을 때만 실행
  });
  
  // 데이터 생성
  const createMutation = useMutation({
    mutationFn: createPost,
    onSuccess: (newPost) => {
      // 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      
      // 또는 캐시 직접 업데이트
      queryClient.setQueryData(['posts', userId], (old: any) => {
        return [...old, newPost];
      });
      
      setTitle('');
    },
    onError: (error) => {
      alert('생성 실패: ' + error.message);
    }
  });
  
  if (isLoading) return <div>로딩중...</div>;
  if (error) return <div>에러: {error.message}</div>;
  
  return (
    <div>
      <div className="mb-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="새 포스트 제목"
          className="input"
        />
        <button
          onClick={() => createMutation.mutate({ title, userId })}
          disabled={createMutation.isLoading}
          className="btn"
        >
          {createMutation.isLoading ? '생성중...' : '포스트 생성'}
        </button>
      </div>
      
      <button onClick={() => refetch()} className="btn">
        새로고침
      </button>
      
      <div className="space-y-2">
        {posts?.map((post: any) => (
          <div key={post.id} className="p-4 border rounded">
            <h3>{post.title}</h3>
            <p>{post.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 무한 스크롤
```tsx
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';

function InfinitePostList() {
  const { ref, inView } = useInView();
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteQuery({
    queryKey: ['posts-infinite'],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await fetch(`/api/posts?page=${pageParam}&limit=10`);
      return response.json();
    },
    getNextPageParam: (lastPage, pages) => {
      return lastPage.hasMore ? pages.length : undefined;
    }
  });
  
  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage]);
  
  if (isLoading) return <div>로딩중...</div>;
  
  return (
    <div>
      {data?.pages.map((page, i) => (
        <div key={i}>
          {page.posts.map((post: any) => (
            <div key={post.id} className="p-4 border-b">
              <h3>{post.title}</h3>
              <p>{post.content}</p>
            </div>
          ))}
        </div>
      ))}
      
      <div ref={ref}>
        {isFetchingNextPage && <div>더 불러오는 중...</div>}
      </div>
    </div>
  );
}
```

### SWR - Vercel의 데이터 페칭 솔루션

**한 줄 정의**: "Stale-While-Revalidate" 전략을 사용하는 경량 데이터 페칭 라이브러리

#### 설치
```bash
npm install swr
```

#### 기본 사용법
```tsx
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

const fetcher = (url: string) => fetch(url).then(res => res.json());

function Profile() {
  const { data, error, isLoading, mutate } = useSWR('/api/user', fetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    refreshInterval: 30000  // 30초마다 갱신
  });
  
  // 조건부 페칭
  const { data: posts } = useSWR(
    data ? `/api/posts?userId=${data.id}` : null,
    fetcher
  );
  
  if (error) return <div>에러 발생</div>;
  if (isLoading) return <div>로딩중...</div>;
  
  return (
    <div>
      <h1>{data.name}</h1>
      <button onClick={() => mutate()}>새로고침</button>
      
      {posts && (
        <div>
          <h2>작성한 글</h2>
          {posts.map((post: any) => (
            <div key={post.id}>{post.title}</div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 🎭 Part 4: UI 컴포넌트 라이브러리

### Radix UI - 접근성 완벽 지원

**한 줄 정의**: 스타일링 없이 접근성과 기능만 제공하는 헤드리스 UI 컴포넌트

#### 설치
```bash
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
```

#### Dialog 예제
```tsx
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

function DialogDemo() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="btn">프로필 편집</button>
      </Dialog.Trigger>
      
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-[90vw] max-w-md">
          <Dialog.Title className="text-xl font-bold mb-4">
            프로필 편집
          </Dialog.Title>
          
          <Dialog.Description className="text-gray-600 mb-4">
            프로필 정보를 수정하세요.
          </Dialog.Description>
          
          <form>
            <input
              className="input w-full mb-4"
              placeholder="이름"
            />
            <input
              className="input w-full mb-4"
              placeholder="이메일"
            />
            
            <div className="flex gap-2 justify-end">
              <Dialog.Close asChild>
                <button type="button" className="btn btn-secondary">
                  취소
                </button>
              </Dialog.Close>
              <button type="submit" className="btn btn-primary">
                저장
              </button>
            </div>
          </form>
          
          <Dialog.Close asChild>
            <button
              className="absolute top-2 right-2 p-1"
              aria-label="Close"
            >
              <X />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

#### Dropdown Menu 예제
```tsx
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { MoreVertical, Edit, Trash, Share } from 'lucide-react';

function DropdownDemo() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="p-2 hover:bg-gray-100 rounded">
          <MoreVertical size={20} />
        </button>
      </DropdownMenu.Trigger>
      
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="bg-white rounded-lg shadow-lg p-1 min-w-[200px]"
          sideOffset={5}
        >
          <DropdownMenu.Item className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded cursor-pointer">
            <Edit size={16} />
            <span>편집</span>
          </DropdownMenu.Item>
          
          <DropdownMenu.Item className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded cursor-pointer">
            <Share size={16} />
            <span>공유</span>
          </DropdownMenu.Item>
          
          <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />
          
          <DropdownMenu.Item className="flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-red-600 rounded cursor-pointer">
            <Trash size={16} />
            <span>삭제</span>
          </DropdownMenu.Item>
          
          <DropdownMenu.Arrow className="fill-white" />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
```

---

## 🎬 Part 5: 애니메이션 라이브러리

### Framer Motion - 선언적 애니메이션

**한 줄 정의**: React 컴포넌트에 부드러운 애니메이션을 쉽게 추가하는 라이브러리

#### 설치
```bash
npm install framer-motion
```

#### 기본 애니메이션
```tsx
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

function AnimationExamples() {
  const [isVisible, setIsVisible] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const items = [
    { id: '1', title: '첫 번째', color: 'bg-blue-500' },
    { id: '2', title: '두 번째', color: 'bg-green-500' },
    { id: '3', title: '세 번째', color: 'bg-purple-500' }
  ];
  
  return (
    <div className="p-8">
      {/* 기본 애니메이션 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-32 h-32 bg-blue-500 rounded-lg mb-8"
      />
      
      {/* 호버 애니메이션 */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="px-6 py-3 bg-green-500 text-white rounded-lg mb-8"
      >
        호버해보세요
      </motion.button>
      
      {/* 드래그 가능한 요소 */}
      <motion.div
        drag
        dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
        className="w-24 h-24 bg-purple-500 rounded-full mb-8 cursor-move"
      />
      
      {/* 리스트 애니메이션 */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {items.map((item) => (
          <motion.div
            key={item.id}
            layoutId={item.id}
            onClick={() => setSelectedId(item.id)}
            className={`p-4 ${item.color} text-white rounded-lg cursor-pointer`}
            whileHover={{ y: -5 }}
          >
            <h3>{item.title}</h3>
          </motion.div>
        ))}
      </div>
      
      {/* 모달 애니메이션 */}
      <AnimatePresence>
        {selectedId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setSelectedId(null)}
            />
            <motion.div
              layoutId={selectedId}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-8 rounded-lg z-50"
            >
              <h2 className="text-2xl mb-4">
                {items.find(item => item.id === selectedId)?.title}
              </h2>
              <button
                onClick={() => setSelectedId(null)}
                className="btn"
              >
                닫기
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* 스태거 애니메이션 */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
        className="space-y-2"
      >
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            variants={{
              hidden: { opacity: 0, x: -20 },
              visible: { opacity: 1, x: 0 }
            }}
            className="p-4 bg-gray-100 rounded"
          >
            아이템 {i}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
```

#### 스크롤 애니메이션
```tsx
import { motion, useScroll, useTransform } from 'framer-motion';

function ScrollAnimation() {
  const { scrollY } = useScroll();
  
  const y = useTransform(scrollY, [0, 500], [0, -100]);
  const opacity = useTransform(scrollY, [0, 200], [1, 0]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.5]);
  
  return (
    <div style={{ height: '200vh' }}>
      <motion.div
        style={{ y, opacity, scale }}
        className="fixed top-20 left-20 w-40 h-40 bg-blue-500 rounded-lg"
      />
      
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
        viewport={{ once: true, amount: 0.5 }}
        className="mt-[100vh] p-8 bg-green-500"
      >
        스크롤하면 나타납니다
      </motion.div>
    </div>
  );
}
```

---

## 📊 Part 6: 테이블과 데이터 그리드

### TanStack Table - 헤드리스 테이블

**한 줄 정의**: 강력하고 확장 가능한 헤드리스 테이블 라이브러리

#### 설치
```bash
npm install @tanstack/react-table
```

#### 기본 사용법
```tsx
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable
} from '@tanstack/react-table';
import { useState } from 'react';

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
};

const data: User[] = [
  { id: 1, name: '김철수', email: 'kim@example.com', role: '개발자', status: 'active' },
  { id: 2, name: '이영희', email: 'lee@example.com', role: '디자이너', status: 'active' },
  // ... 더 많은 데이터
];

function DataTable() {
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  
  const columnHelper = createColumnHelper<User>();
  
  const columns = [
    columnHelper.accessor('id', {
      header: 'ID',
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('name', {
      header: '이름',
      cell: info => (
        <span className="font-semibold">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor('email', {
      header: '이메일',
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('role', {
      header: '역할',
      cell: info => (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('status', {
      header: '상태',
      cell: info => (
        <span className={`px-2 py-1 rounded ${
          info.getValue() === 'active' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {info.getValue() === 'active' ? '활성' : '비활성'}
        </span>
      ),
    }),
  ];
  
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });
  
  return (
    <div className="p-4">
      {/* 검색 */}
      <input
        value={globalFilter ?? ''}
        onChange={e => setGlobalFilter(e.target.value)}
        className="mb-4 p-2 border rounded"
        placeholder="검색..."
      />
      
      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      <span>
                        {{
                          asc: ' 🔼',
                          desc: ' 🔽',
                        }[header.column.getIsSorted() as string] ?? ''}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* 페이지네이션 */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            이전
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            다음
          </button>
        </div>
        
        <span className="text-sm text-gray-700">
          페이지 {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
        </span>
        
        <select
          value={table.getState().pagination.pageSize}
          onChange={e => table.setPageSize(Number(e.target.value))}
          className="border rounded px-2 py-1"
        >
          {[10, 20, 30, 50].map(pageSize => (
            <option key={pageSize} value={pageSize}>
              {pageSize}개씩 보기
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
```

---

## 🛠️ Part 7: 유틸리티 라이브러리

### React Hot Toast - 알림 메시지

**한 줄 정의**: 아름답고 가벼운 토스트 알림 라이브러리

#### 설치
```bash
npm install react-hot-toast
```

#### 사용법
```tsx
import toast, { Toaster } from 'react-hot-toast';

// App.tsx에 Toaster 추가
function App() {
  return (
    <>
      <YourApp />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </>
  );
}

// 컴포넌트에서 사용
function NotificationExample() {
  const handleSuccess = () => {
    toast.success('성공적으로 저장되었습니다!');
  };
  
  const handleError = () => {
    toast.error('오류가 발생했습니다.');
  };
  
  const handlePromise = () => {
    const myPromise = fetch('/api/data');
    
    toast.promise(myPromise, {
      loading: '저장 중...',
      success: '저장 완료!',
      error: '저장 실패',
    });
  };
  
  const handleCustom = () => {
    toast.custom((t) => (
      <div className={`${
        t.visible ? 'animate-enter' : 'animate-leave'
      } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
        <div className="flex-1 w-0 p-4">
          <p className="text-sm font-medium text-gray-900">
            커스텀 알림
          </p>
          <p className="mt-1 text-sm text-gray-500">
            원하는 대로 디자인할 수 있습니다.
          </p>
        </div>
        <div className="flex border-l border-gray-200">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            닫기
          </button>
        </div>
      </div>
    ));
  };
  
  return (
    <div className="space-x-2">
      <button onClick={handleSuccess} className="btn">성공</button>
      <button onClick={handleError} className="btn">에러</button>
      <button onClick={handlePromise} className="btn">Promise</button>
      <button onClick={handleCustom} className="btn">커스텀</button>
    </div>
  );
}
```

### React DnD - 드래그 앤 드롭

**한 줄 정의**: 복잡한 드래그 앤 드롭 인터페이스를 쉽게 구현하는 라이브러리

#### 설치
```bash
npm install react-dnd react-dnd-html5-backend
```

#### 칸반 보드 예제
```tsx
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useState } from 'react';

type Task = {
  id: string;
  content: string;
  status: 'todo' | 'doing' | 'done';
};

const ItemTypes = {
  TASK: 'task'
};

function TaskCard({ task, moveTask }: { task: Task; moveTask: any }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.TASK,
    item: { id: task.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));
  
  return (
    <div
      ref={drag}
      className={`p-3 bg-white rounded shadow mb-2 cursor-move ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      {task.content}
    </div>
  );
}

function Column({ status, tasks, moveTask }: any) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.TASK,
    drop: (item: { id: string }) => moveTask(item.id, status),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));
  
  const titles = {
    todo: '할 일',
    doing: '진행 중',
    done: '완료'
  };
  
  return (
    <div
      ref={drop}
      className={`flex-1 p-4 bg-gray-100 rounded ${
        isOver ? 'bg-gray-200' : ''
      }`}
    >
      <h3 className="font-bold mb-4">{titles[status]}</h3>
      <div className="min-h-[200px]">
        {tasks.map((task: Task) => (
          <TaskCard key={task.id} task={task} moveTask={moveTask} />
        ))}
      </div>
    </div>
  );
}

function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', content: '프로젝트 기획', status: 'todo' },
    { id: '2', content: '디자인 작업', status: 'doing' },
    { id: '3', content: '개발 시작', status: 'todo' },
    { id: '4', content: '테스트', status: 'done' },
  ]);
  
  const moveTask = (taskId: string, newStatus: Task['status']) => {
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
  };
  
  const getTasksByStatus = (status: Task['status']) =>
    tasks.filter(task => task.status === status);
  
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex gap-4 p-8">
        <Column status="todo" tasks={getTasksByStatus('todo')} moveTask={moveTask} />
        <Column status="doing" tasks={getTasksByStatus('doing')} moveTask={moveTask} />
        <Column status="done" tasks={getTasksByStatus('done')} moveTask={moveTask} />
      </div>
    </DndProvider>
  );
}
```

---

## 📦 Part 8: 개발 도구

### React DevTools

브라우저 확장 프로그램으로 React 컴포넌트 트리를 검사하고 디버깅할 수 있습니다.

### Vite

Create React App보다 100배 빠른 빌드 도구입니다.

```bash
npm create vite@latest my-app -- --template react-ts
```

### Million.js

React를 70% 더 빠르게 만드는 컴파일러입니다.

```bash
npm install million
```

```js
// vite.config.js
import million from 'million/compiler';

export default {
  plugins: [million.vite({ auto: true })]
};
```

---

## 🎓 학습 리소스

### 라이브러리별 공식 문서
- [Zustand](https://zustand-demo.pmnd.rs/)
- [React Query](https://tanstack.com/query)
- [React Hook Form](https://react-hook-form.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Radix UI](https://www.radix-ui.com/)

### 추천 학습 순서
1. **상태 관리**: Zustand부터 시작
2. **폼 관리**: React Hook Form 마스터
3. **데이터 페칭**: TanStack Query 활용
4. **UI 컴포넌트**: Radix UI 또는 Headless UI
5. **애니메이션**: 필요시 Framer Motion 추가

---

## 🎯 라이브러리 선택 가이드

### 상태 관리
- **간단한 앱**: Zustand
- **원자적 상태**: Jotai
- **대규모 앱**: Redux Toolkit
- **서버 상태**: TanStack Query

### UI 컴포넌트
- **커스터마이징 필요**: Radix UI, Headless UI
- **빠른 프로토타이핑**: Ant Design, Material-UI
- **디자인 시스템 구축**: Radix UI + Tailwind

### 폼 처리
- **복잡한 폼**: React Hook Form
- **간단한 폼**: 기본 React state
- **실시간 검증**: React Hook Form + Zod

### 애니메이션
- **복잡한 애니메이션**: Framer Motion
- **간단한 전환**: CSS Transitions
- **3D 애니메이션**: React Three Fiber

---

## 🎬 마무리

React 생태계는 방대하지만, 핵심 라이브러리들을 잘 조합하면 놀라운 생산성을 발휘할 수 있습니다.

### 핵심 정리

✅ **상태 관리**: Zustand로 시작하여 필요에 따라 확장  
✅ **데이터 페칭**: TanStack Query로 서버 상태 관리  
✅ **폼 관리**: React Hook Form으로 복잡한 폼도 쉽게  
✅ **UI 컴포넌트**: Radix UI로 접근성 보장  
✅ **애니메이션**: Framer Motion으로 생동감 추가  

### 시작하기 위한 최소 세트

```json
{
  "dependencies": {
    "react": "^18",
    "zustand": "^4",
    "@tanstack/react-query": "^5",
    "react-hook-form": "^7",
    "react-hot-toast": "^2"
  }
}
```

### 마지막 조언

"모든 라이브러리를 한 번에 도입하려 하지 마세요. 프로젝트의 필요에 따라 하나씩 추가하며, 각 라이브러리를 충분히 이해하고 활용하세요. 좋은 도구는 개발을 돕지만, 과도한 의존은 오히려 복잡성을 증가시킵니다."

**이제 여러분도 React 생태계의 강력한 도구들을 활용할 준비가 되었습니다!** 🚀

---