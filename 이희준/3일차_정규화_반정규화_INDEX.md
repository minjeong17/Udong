# 정규화, 반정규화, 인덱스 완벽 가이드: 데이터베이스 성능 최적화의 핵심

## 📌 들어가며

"왜 우리 서비스는 사용자가 많아지면 느려질까?" "똑같은 쿼리인데 왜 어떤 건 빠르고 어떤 건 느릴까?" 

이런 의문을 가져보신 적 있나요? 데이터베이스 설계의 핵심인 **정규화/반정규화**와 **인덱스**를 제대로 이해하면, 이런 문제들을 해결할 수 있습니다.

---

## 🎯 핵심 개념 한눈에 보기

### 오늘 배울 내용
```
정규화 (Normalization)
├── 데이터 중복 제거
├── 데이터 무결성 보장
└── 1NF → 2NF → 3NF → BCNF

반정규화 (Denormalization)  
├── 성능 향상을 위한 의도적 중복
├── 조회 성능 vs 저장 공간 트레이드오프
└── 실무에서의 적절한 타협

인덱스 (Index)
├── 클러스터링 인덱스: 데이터의 물리적 정렬
├── 논클러스터링 인덱스: 별도의 참조 구조
└── 성능 최적화의 핵심 도구
```

---

## 📊 Part 1: 정규화 (Normalization)

### 정규화란 무엇인가?

**한 줄 정의**: 데이터베이스에서 중복을 최소화하고 데이터 무결성을 보장하기 위해 테이블을 체계적으로 분해하는 과정

### 비유로 이해하기: 옷장 정리

정규화되지 않은 데이터베이스는 **정리되지 않은 옷장**과 같습니다:
- 같은 옷이 여러 곳에 있음 (데이터 중복)
- 계절별로 섞여 있음 (논리적 그룹화 부재)
- 찾기도 어렵고 관리도 힘듦 (유지보수 어려움)

정규화는 이 옷장을:
- 종류별로 분류 (테이블 분리)
- 중복 제거 (같은 옷은 한 곳에만)
- 체계적으로 정리 (관계 설정)

### 정규화가 필요한 이유

#### 정규화 전 문제점 예시

```sql
-- 잘못된 설계: 모든 정보가 한 테이블에
CREATE TABLE orders_bad (
    order_id INT,
    customer_name VARCHAR(100),
    customer_email VARCHAR(100),
    customer_phone VARCHAR(20),
    product_name VARCHAR(100),
    product_price DECIMAL(10,2),
    product_category VARCHAR(50),
    order_date DATE,
    quantity INT
);

-- 문제점:
-- 1. 같은 고객이 여러 주문 → 고객 정보 중복
-- 2. 같은 상품이 여러 주문 → 상품 정보 중복  
-- 3. 고객 전화번호 변경 시 → 모든 레코드 수정 필요
```

### 정규화 단계별 가이드

#### 제1정규형 (1NF): 원자값 보장

**규칙**: 각 컬럼은 하나의 값만 가져야 함

```sql
-- 위반 사례
CREATE TABLE student_bad (
    student_id INT,
    name VARCHAR(100),
    subjects VARCHAR(500)  -- "수학,영어,과학" 같은 형태
);

-- 1NF 적용
CREATE TABLE student (
    student_id INT,
    name VARCHAR(100)
);

CREATE TABLE student_subject (
    student_id INT,
    subject VARCHAR(50),
    PRIMARY KEY (student_id, subject)
);
```

#### 제2정규형 (2NF): 부분 종속 제거

**규칙**: 기본키의 일부가 아닌 전체에 종속

```sql
-- 위반 사례 (복합키의 일부에만 종속)
CREATE TABLE order_detail_bad (
    order_id INT,
    product_id INT,
    product_name VARCHAR(100),  -- product_id에만 종속
    quantity INT,
    PRIMARY KEY (order_id, product_id)
);

-- 2NF 적용
CREATE TABLE product (
    product_id INT PRIMARY KEY,
    product_name VARCHAR(100)
);

CREATE TABLE order_detail (
    order_id INT,
    product_id INT,
    quantity INT,
    PRIMARY KEY (order_id, product_id),
    FOREIGN KEY (product_id) REFERENCES product(product_id)
);
```

#### 제3정규형 (3NF): 이행적 종속 제거

**규칙**: 기본키에만 직접 종속 (다른 일반 컬럼을 거치지 않음)

```sql
-- 위반 사례 (이행적 종속)
CREATE TABLE employee_bad (
    emp_id INT PRIMARY KEY,
    dept_id INT,
    dept_name VARCHAR(100),  -- dept_id → dept_name (이행적)
    emp_name VARCHAR(100)
);

-- 3NF 적용
CREATE TABLE department (
    dept_id INT PRIMARY KEY,
    dept_name VARCHAR(100)
);

CREATE TABLE employee (
    emp_id INT PRIMARY KEY,
    dept_id INT,
    emp_name VARCHAR(100),
    FOREIGN KEY (dept_id) REFERENCES department(dept_id)
);
```

#### BCNF (Boyce-Codd Normal Form)

**규칙**: 모든 결정자가 후보키여야 함

```sql
-- 위반 사례
CREATE TABLE class_bad (
    student_id INT,
    subject VARCHAR(50),
    teacher VARCHAR(100),  -- teacher → subject (교사는 한 과목만 가르침)
    PRIMARY KEY (student_id, subject)
);

-- BCNF 적용
CREATE TABLE teacher_subject (
    teacher VARCHAR(100) PRIMARY KEY,
    subject VARCHAR(50)
);

CREATE TABLE student_class (
    student_id INT,
    teacher VARCHAR(100),
    PRIMARY KEY (student_id, teacher),
    FOREIGN KEY (teacher) REFERENCES teacher_subject(teacher)
);
```

### 정규화의 실제 적용 예시

#### 온라인 쇼핑몰 데이터베이스 설계

```sql
-- 정규화된 설계

-- 고객 테이블
CREATE TABLE customers (
    customer_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 주소 테이블 (1:N 관계)
CREATE TABLE addresses (
    address_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT,
    address_type ENUM('home', 'office', 'other'),
    street VARCHAR(200),
    city VARCHAR(50),
    postal_code VARCHAR(10),
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

-- 카테고리 테이블
CREATE TABLE categories (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    parent_category_id INT,
    FOREIGN KEY (parent_category_id) REFERENCES categories(category_id)
);

-- 상품 테이블
CREATE TABLE products (
    product_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category_id INT,
    stock_quantity INT DEFAULT 0,
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

-- 주문 테이블
CREATE TABLE orders (
    order_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10, 2),
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled'),
    shipping_address_id INT,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    FOREIGN KEY (shipping_address_id) REFERENCES addresses(address_id)
);

-- 주문 상세 테이블 (주문과 상품의 M:N 관계)
CREATE TABLE order_items (
    order_id INT,
    product_id INT,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    PRIMARY KEY (order_id, product_id),
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);
```

---

## 🔄 Part 2: 반정규화 (Denormalization)

### 반정규화란 무엇인가?

**한 줄 정의**: 조회 성능 향상을 위해 정규화된 데이터베이스에 의도적으로 중복을 추가하는 기법

### 왜 반정규화가 필요한가?

#### 정규화의 단점
1. **조인 비용**: 여러 테이블을 조인하면 성능 저하
2. **복잡한 쿼리**: 간단한 정보도 복잡한 쿼리 필요
3. **실시간 집계**: 매번 계산하면 응답 시간 증가

### 반정규화 기법들

#### 1. 계산된 컬럼 추가

```sql
-- 반정규화 전: 매번 계산 필요
SELECT 
    o.order_id,
    SUM(oi.quantity * oi.unit_price) as total
FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id
GROUP BY o.order_id;

-- 반정규화: total_amount 컬럼 추가
ALTER TABLE orders ADD COLUMN total_amount DECIMAL(10,2);

-- 트리거로 자동 업데이트
DELIMITER $$
CREATE TRIGGER update_order_total
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
    UPDATE orders 
    SET total_amount = (
        SELECT SUM(quantity * unit_price)
        FROM order_items
        WHERE order_id = NEW.order_id
    )
    WHERE order_id = NEW.order_id;
END$$
DELIMITER ;
```

#### 2. 중복 컬럼 추가

```sql
-- 반정규화 전: 고객 이름을 위해 조인 필요
SELECT o.order_id, c.name
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id;

-- 반정규화: 자주 사용되는 고객명을 주문 테이블에 추가
ALTER TABLE orders ADD COLUMN customer_name VARCHAR(100);

-- 단, 고객명 변경 시 동기화 필요
UPDATE orders o
JOIN customers c ON o.customer_id = c.customer_id
SET o.customer_name = c.name
WHERE c.customer_id = ?;
```

#### 3. 테이블 통합

```sql
-- 1:1 관계이고 항상 함께 조회되는 경우

-- 정규화된 설계
CREATE TABLE users (
    user_id INT PRIMARY KEY,
    username VARCHAR(50)
);

CREATE TABLE user_profiles (
    user_id INT PRIMARY KEY,
    bio TEXT,
    avatar_url VARCHAR(200),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- 반정규화: 테이블 통합
CREATE TABLE users (
    user_id INT PRIMARY KEY,
    username VARCHAR(50),
    bio TEXT,
    avatar_url VARCHAR(200)
);
```

#### 4. 요약 테이블 생성

```sql
-- 일별 매출 요약 테이블
CREATE TABLE daily_sales_summary (
    date DATE PRIMARY KEY,
    total_orders INT,
    total_revenue DECIMAL(12, 2),
    avg_order_value DECIMAL(10, 2),
    top_product_id INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 배치 작업으로 주기적 업데이트
INSERT INTO daily_sales_summary 
SELECT 
    DATE(order_date) as date,
    COUNT(*) as total_orders,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as avg_order_value,
    (
        SELECT product_id 
        FROM order_items oi2
        WHERE DATE(o2.order_date) = DATE(o.order_date)
        GROUP BY product_id
        ORDER BY SUM(quantity) DESC
        LIMIT 1
    ) as top_product_id,
    NOW()
FROM orders o
WHERE DATE(order_date) = CURDATE() - INTERVAL 1 DAY
GROUP BY DATE(order_date)
ON DUPLICATE KEY UPDATE
    total_orders = VALUES(total_orders),
    total_revenue = VALUES(total_revenue),
    avg_order_value = VALUES(avg_order_value),
    top_product_id = VALUES(top_product_id),
    updated_at = NOW();
```

### 반정규화 의사결정 가이드

#### 반정규화를 고려해야 할 때

✅ **조회가 압도적으로 많은 경우** (읽기:쓰기 = 1000:1 이상)
✅ **실시간 응답이 중요한 경우** (대시보드, 리포트)
✅ **조인이 5개 이상인 복잡한 쿼리**
✅ **대용량 데이터에서 집계 연산**

#### 반정규화를 피해야 할 때

❌ **데이터 정확성이 최우선**
❌ **업데이트가 빈번한 경우**
❌ **저장 공간이 제한적**
❌ **동기화 로직이 너무 복잡**

---

## 🔍 Part 3: 인덱스 (Index)

### 인덱스란 무엇인가?

**한 줄 정의**: 데이터베이스 테이블의 검색 속도를 향상시키기 위한 자료구조

### 책의 색인으로 이해하기

인덱스는 책 뒤의 **색인(Index)**과 같습니다:
- 책 전체를 읽지 않고도 원하는 내용을 빠르게 찾을 수 있음
- 색인 자체도 공간을 차지함
- 책 내용이 바뀌면 색인도 업데이트해야 함

### 인덱스가 없을 때 vs 있을 때

```sql
-- 인덱스 없이: Full Table Scan
-- 100만 건 중에서 1건 찾기 = 100만 건 모두 확인
SELECT * FROM users WHERE email = 'user@example.com';
-- 실행 시간: 2.5초

-- 인덱스 생성
CREATE INDEX idx_users_email ON users(email);

-- 인덱스 있을 때: Index Scan
-- B-Tree 탐색으로 바로 찾기
SELECT * FROM users WHERE email = 'user@example.com';
-- 실행 시간: 0.001초
```

---

## 🎯 클러스터링 인덱스 (Clustered Index)

### 개념 이해

**클러스터링 인덱스**는 실제 데이터가 인덱스 순서대로 **물리적으로 정렬**되어 저장됩니다.

### 전화번호부 비유

클러스터링 인덱스는 **전화번호부**와 같습니다:
- 이름순(ㄱ,ㄴ,ㄷ...)으로 실제 데이터가 정렬
- 한 권의 전화번호부는 한 가지 순서로만 정렬 가능
- 테이블당 **단 하나**의 클러스터링 인덱스만 가능

### 클러스터링 인덱스 특징

#### 장점
✅ 범위 검색이 매우 빠름
✅ 순차적 접근 시 뛰어난 성능
✅ 추가 저장 공간 불필요

#### 단점
❌ 삽입/수정 시 데이터 재정렬 필요
❌ 테이블당 하나만 생성 가능
❌ 인덱스 키 변경 시 물리적 재배치

### 클러스터링 인덱스 생성

```sql
-- MySQL InnoDB: PRIMARY KEY가 자동으로 클러스터링 인덱스
CREATE TABLE employees (
    emp_id INT PRIMARY KEY,  -- 클러스터링 인덱스
    name VARCHAR(100),
    department VARCHAR(50),
    salary DECIMAL(10, 2)
);

-- SQL Server: 명시적 지정
CREATE CLUSTERED INDEX idx_emp_id 
ON employees(emp_id);

-- 데이터는 emp_id 순서로 물리적 저장
-- 1, 2, 3, 4, 5... 순서로 디스크에 배치
```

### 클러스터링 인덱스 활용 예시

```sql
-- 범위 검색: 클러스터링 인덱스가 매우 효율적
SELECT * FROM employees 
WHERE emp_id BETWEEN 1000 AND 2000;
-- 연속된 데이터 블록을 순차적으로 읽기

-- 시계열 데이터에 효과적
CREATE TABLE logs (
    log_id BIGINT AUTO_INCREMENT PRIMARY KEY,  -- 시간순 자동 증가
    created_at TIMESTAMP,
    message TEXT
);

-- 최근 로그 조회가 매우 빠름
SELECT * FROM logs 
WHERE log_id > (SELECT MAX(log_id) - 1000 FROM logs);
```

---

## 📚 논클러스터링 인덱스 (Non-Clustered Index)

### 개념 이해

**논클러스터링 인덱스**는 실제 데이터와 별도로 인덱스 구조를 생성합니다.

### 책의 색인 비유

논클러스터링 인덱스는 **책 뒤의 색인**과 같습니다:
- 키워드(인덱스 키)와 페이지 번호(데이터 위치)를 매핑
- 여러 색인 생성 가능 (주제별, 인물별, 연도별...)
- 실제 내용과는 별도로 존재

### 논클러스터링 인덱스 특징

#### 장점
✅ 여러 개 생성 가능
✅ 데이터 재정렬 불필요
✅ 다양한 검색 패턴 지원

#### 단점
❌ 추가 저장 공간 필요
❌ 데이터 접근 시 추가 I/O (인덱스 → 데이터)
❌ 인덱스 관리 오버헤드

### 논클러스터링 인덱스 생성

```sql
-- 단일 컬럼 인덱스
CREATE INDEX idx_emp_name ON employees(name);
CREATE INDEX idx_emp_dept ON employees(department);

-- 복합 인덱스 (Multiple Column Index)
CREATE INDEX idx_dept_salary ON employees(department, salary);

-- 유니크 인덱스
CREATE UNIQUE INDEX idx_emp_email ON employees(email);

-- 부분 인덱스 (PostgreSQL)
CREATE INDEX idx_active_users ON users(email) 
WHERE status = 'active';
```

### 논클러스터링 인덱스 내부 구조

```sql
-- 인덱스 구조 예시
/*
idx_emp_name (B-Tree)
├── 'Alice' → RowID: 5
├── 'Bob' → RowID: 2
├── 'Charlie' → RowID: 8
├── 'David' → RowID: 1
└── 'Eve' → RowID: 3

실제 데이터 (Heap)
RowID 1: {emp_id: 1001, name: 'David', ...}
RowID 2: {emp_id: 1002, name: 'Bob', ...}
RowID 3: {emp_id: 1003, name: 'Eve', ...}
...
*/
```

---

## ⚖️ 클러스터링 vs 논클러스터링 인덱스 비교

### 상세 비교표

| 구분 | 클러스터링 인덱스 | 논클러스터링 인덱스 |
|------|------------------|---------------------|
| **데이터 저장** | 인덱스 순서로 물리적 정렬 | 별도 인덱스 구조 |
| **개수 제한** | 테이블당 1개 | 여러 개 가능 |
| **저장 공간** | 추가 공간 불필요 | 추가 공간 필요 |
| **검색 속도** | 범위 검색 매우 빠름 | 포인트 검색 빠름 |
| **삽입 속도** | 느림 (재정렬 필요) | 상대적으로 빠름 |
| **적합한 경우** | 순차 접근, 범위 검색 | 다양한 조건 검색 |

### 실전 선택 가이드

```sql
-- 클러스터링 인덱스가 적합한 경우
-- 1. 시계열 데이터
CREATE TABLE transactions (
    trans_id BIGINT AUTO_INCREMENT PRIMARY KEY,  -- 시간순 증가
    trans_date TIMESTAMP,
    amount DECIMAL(10,2)
);

-- 2. 범위 검색이 많은 경우
SELECT * FROM transactions 
WHERE trans_id BETWEEN ? AND ?;

-- 논클러스터링 인덱스가 적합한 경우
-- 1. 다양한 조건으로 검색
CREATE INDEX idx_customer ON orders(customer_id);
CREATE INDEX idx_status ON orders(status);
CREATE INDEX idx_date ON orders(order_date);

-- 2. 자주 변경되는 컬럼
CREATE INDEX idx_status ON orders(status);  -- 상태는 자주 변경됨
```

---

## 🚀 인덱스 최적화 전략

### 1. 카디널리티 고려

```sql
-- 높은 카디널리티 (Good) - 고유값이 많음
CREATE INDEX idx_email ON users(email);  -- 거의 모든 값이 유니크

-- 낮은 카디널리티 (Bad) - 고유값이 적음
CREATE INDEX idx_gender ON users(gender);  -- M/F 두 개뿐

-- 복합 인덱스로 카디널리티 높이기
CREATE INDEX idx_gender_age ON users(gender, age);
```

### 2. 커버링 인덱스

```sql
-- 인덱스만으로 쿼리 완성 (테이블 접근 불필요)
CREATE INDEX idx_covering 
ON orders(customer_id, order_date, total_amount);

-- 이 쿼리는 인덱스만 읽음 (매우 빠름)
SELECT customer_id, order_date, total_amount
FROM orders
WHERE customer_id = 123
AND order_date >= '2024-01-01';
```

### 3. 인덱스 힌트

```sql
-- MySQL 인덱스 힌트
SELECT * FROM orders USE INDEX (idx_customer)
WHERE customer_id = 123;

SELECT * FROM orders FORCE INDEX (idx_date)
WHERE order_date = '2024-01-01';

-- PostgreSQL 인덱스 힌트
SET enable_seqscan = OFF;  -- 순차 스캔 비활성화
SELECT * FROM orders WHERE customer_id = 123;
```

### 4. 인덱스 모니터링

```sql
-- MySQL: 사용되지 않는 인덱스 찾기
SELECT 
    table_schema,
    table_name,
    index_name,
    cardinality
FROM information_schema.statistics
WHERE table_schema = 'your_database'
AND cardinality = 0;

-- PostgreSQL: 인덱스 사용 통계
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,  -- 인덱스 스캔 횟수
    idx_tup_read,  -- 읽은 튜플 수
    idx_tup_fetch  -- 반환된 튜플 수
FROM pg_stat_user_indexes
ORDER BY idx_scan;
```

---

## 💡 실전 적용 사례

### 사례 1: 전자상거래 플랫폼

```sql
-- 주문 테이블 최적화
CREATE TABLE orders (
    order_id BIGINT AUTO_INCREMENT PRIMARY KEY,  -- 클러스터링
    customer_id INT NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20),
    total_amount DECIMAL(10,2),
    
    -- 논클러스터링 인덱스들
    INDEX idx_customer (customer_id),
    INDEX idx_date (order_date),
    INDEX idx_status_date (status, order_date),  -- 복합 인덱스
    INDEX idx_amount (total_amount)  -- 금액별 분석용
);

-- 반정규화: 고객명 추가 (조인 감소)
ALTER TABLE orders ADD COLUMN customer_name VARCHAR(100);

-- 요약 테이블 (일별 매출)
CREATE TABLE daily_revenue (
    date DATE PRIMARY KEY,  -- 클러스터링
    total_orders INT,
    total_revenue DECIMAL(12,2),
    INDEX idx_revenue (total_revenue)
);
```

### 사례 2: 소셜 미디어 플랫폼

```sql
-- 사용자 테이블
CREATE TABLE users (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_created (created_at)
);

-- 게시물 테이블
CREATE TABLE posts (
    post_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    like_count INT DEFAULT 0,  -- 반정규화: 카운트 캐싱
    
    INDEX idx_user_created (user_id, created_at DESC),
    INDEX idx_popular (like_count DESC, created_at DESC),
    FULLTEXT idx_content (content)  -- 전문 검색
);

-- 팔로우 관계 (다대다)
CREATE TABLE follows (
    follower_id BIGINT,
    following_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (follower_id, following_id),  -- 복합 클러스터링
    INDEX idx_following (following_id, follower_id)  -- 역방향 조회
);
```

### 사례 3: 로그 분석 시스템

```sql
-- 로그 테이블 (시계열 데이터)
CREATE TABLE access_logs (
    log_id BIGINT AUTO_INCREMENT PRIMARY KEY,  -- 시간순 클러스터링
    user_ip VARCHAR(45),
    endpoint VARCHAR(200),
    method VARCHAR(10),
    status_code INT,
    response_time INT,  -- milliseconds
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 분석용 인덱스
    INDEX idx_endpoint (endpoint),
    INDEX idx_status (status_code),
    INDEX idx_slow (response_time),  -- 느린 요청 찾기
    INDEX idx_time_endpoint (created_at, endpoint)  -- 시간대별 분석
) PARTITION BY RANGE (UNIX_TIMESTAMP(created_at)) (
    PARTITION p_2024_01 VALUES LESS THAN (UNIX_TIMESTAMP('2024-02-01')),
    PARTITION p_2024_02 VALUES LESS THAN (UNIX_TIMESTAMP('2024-03-01')),
    -- ... 월별 파티션
);

-- 시간별 요약 (반정규화)
CREATE TABLE hourly_stats (
    hour_slot DATETIME PRIMARY KEY,  -- '2024-01-01 14:00:00'
    total_requests INT,
    avg_response_time DECIMAL(10,2),
    error_count INT,
    unique_users INT,
    
    INDEX idx_response_time (avg_response_time DESC)
);
```

---

## 📊 성능 측정 및 튜닝

### EXPLAIN으로 쿼리 분석

```sql
-- MySQL EXPLAIN
EXPLAIN SELECT * FROM orders 
WHERE customer_id = 123 
AND order_date >= '2024-01-01';

/*
+----+-------------+--------+------+---------------+-------------+
| id | select_type | table  | type | possible_keys | key         |
+----+-------------+--------+------+---------------+-------------+
|  1 | SIMPLE      | orders | ref  | idx_customer  | idx_customer|
+----+-------------+--------+------+---------------+-------------+
type:
- ALL: 풀 테이블 스캔 (최악)
- index: 인덱스 풀 스캔
- range: 인덱스 범위 스캔
- ref: 인덱스 사용
- const: 상수 (최선)
*/

-- PostgreSQL EXPLAIN ANALYZE
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM orders 
WHERE customer_id = 123;
```

### 인덱스 통계 업데이트

```sql
-- MySQL
ANALYZE TABLE orders;
OPTIMIZE TABLE orders;

-- PostgreSQL  
VACUUM ANALYZE orders;
REINDEX TABLE orders;

-- SQL Server
UPDATE STATISTICS orders;
ALTER INDEX ALL ON orders REBUILD;
```

### 느린 쿼리 찾기

```sql
-- MySQL Slow Query Log
SET GLOBAL slow_query_log = 1;
SET GLOBAL long_query_time = 1;  -- 1초 이상

-- 느린 쿼리 분석
SELECT 
    query,
    exec_count,
    avg_query_time
FROM mysql.slow_log
ORDER BY avg_query_time DESC
LIMIT 10;
```

---

## 🎓 학습 리소스

### 필독서
- "Database System Concepts" - Silberschatz
- "High Performance MySQL" - Schwartz
- "SQL Performance Explained" - Winand

### 온라인 리소스
- [Use The Index, Luke](https://use-the-index-luke.com/)
- [MySQL Performance Blog](https://www.percona.com/blog/)
- [PostgreSQL Wiki](https://wiki.postgresql.org/wiki/Main_Page)

### 실습 도구
- MySQL Workbench
- pgAdmin
- DBeaver
- DataGrip

### 추천 학습 경로
1. **기초 (1-2주)**
   - 정규화 개념과 정규형
   - 기본 인덱스 이해
   - EXPLAIN 사용법

2. **중급 (3-4주)**
   - 반정규화 전략
   - 복합 인덱스 설계
   - 쿼리 최적화

3. **고급 (지속적)**
   - 파티셔닝
   - 샤딩
   - 분산 데이터베이스

---

## 🚧 자주 하는 실수와 해결책

### 1. 과도한 정규화
```sql
-- 문제: 간단한 정보도 5개 테이블 조인
-- 해결: 적절한 반정규화 적용
```

### 2. 무분별한 인덱스 생성
```sql
-- 문제: 모든 컬럼에 인덱스
-- 결과: INSERT/UPDATE 성능 저하, 저장 공간 낭비
-- 해결: 실제 쿼리 패턴 분석 후 선택적 생성
```

### 3. 복합 인덱스 순서 실수
```sql
-- 잘못된 순서
CREATE INDEX idx_wrong ON orders(status, customer_id);
-- WHERE customer_id = 123  -- 인덱스 사용 못함

-- 올바른 순서 (카디널리티 높은 것부터)
CREATE INDEX idx_correct ON orders(customer_id, status);
```

### 4. LIKE 검색 인덱스 실수
```sql
-- 인덱스 사용 불가
SELECT * FROM users WHERE name LIKE '%kim%';

-- 인덱스 사용 가능
SELECT * FROM users WHERE name LIKE 'kim%';
```

---

## 🎯 실전 의사결정 플로우차트

```
데이터베이스 설계 시작
    │
    ├─ 정규화 수행 (3NF까지)
    │   │
    │   ├─ 성능 테스트
    │   │
    │   ├─ 조회 성능 문제? ──Yes──> 반정규화 검토
    │   │                           │
    │   │                           ├─ 계산 컬럼 추가
    │   │                           ├─ 중복 컬럼 추가
    │   │                           └─ 요약 테이블 생성
    │   │
    │   └─ 인덱스 설계
    │       │
    │       ├─ PRIMARY KEY → 클러스터링 인덱스
    │       │
    │       ├─ 자주 검색되는 컬럼 → 논클러스터링 인덱스
    │       │
    │       ├─ 복합 조건 검색 → 복합 인덱스
    │       │
    │       └─ 성능 모니터링 → 지속적 튜닝
    │
    └─ 프로덕션 배포
```

---

## 🎬 마무리

데이터베이스 최적화는 **정규화**, **반정규화**, **인덱스**의 균형을 찾는 예술입니다.

### 핵심 정리

✅ **정규화**: 데이터 무결성과 중복 제거를 위한 기본  
✅ **반정규화**: 성능을 위한 전략적 타협  
✅ **클러스터링 인덱스**: 물리적 정렬로 범위 검색 최적화  
✅ **논클러스터링 인덱스**: 다양한 검색 패턴 지원  
✅ **균형점 찾기**: 정규화 ↔ 성능의 적절한 트레이드오프  

### 기억해야 할 원칙

1. **먼저 정규화, 필요시 반정규화**
2. **측정 없는 최적화는 추측일 뿐**
3. **인덱스는 은탄환이 아니다**
4. **워크로드에 맞는 설계가 최선**

### 마지막 조언

"완벽한 데이터베이스 설계는 없습니다. 여러분의 서비스 특성과 요구사항에 맞는 최적의 설계를 찾아가는 것이 중요합니다. 작게 시작하고, 측정하고, 개선하세요!"