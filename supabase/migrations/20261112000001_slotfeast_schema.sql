-- ============================================================================
-- SlotFeast - Campus Canteen OS: PostgreSQL Database Schema Migration
-- ============================================================================

-- 1. PROFILES & ROLES
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'kitchen', 'manager')),
    department_id UUID,
    semester INT CHECK (semester BETWEEN 1 AND 8),
    roll_number VARCHAR(50),
    phone VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. DEPARTMENTS
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL, -- e.g. 'AIML', 'CSE', 'ECE', 'MECH'
    name VARCHAR(150) NOT NULL,
    student_count INT DEFAULT 150,
    building VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. DEPARTMENT SCHEDULES (Staggered Break Times)
CREATE TABLE IF NOT EXISTS department_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    break_name VARCHAR(100) NOT NULL DEFAULT 'Lunch Break',
    start_time TIME NOT NULL, -- e.g. 12:00:00
    end_time TIME NOT NULL,   -- e.g. 12:30:00
    days_of_week TEXT[] DEFAULT ARRAY['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    expected_eaters INT DEFAULT 100,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. MENU ITEMS & STOCK
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    category VARCHAR(50) NOT NULL, -- 'Meals', 'Snacks', 'Beverages', 'Quick Bites'
    image_url TEXT,
    prep_minutes INT NOT NULL DEFAULT 5,
    is_ready_made BOOLEAN NOT NULL DEFAULT FALSE,
    current_stock INT NOT NULL DEFAULT 50 CHECK (current_stock >= 0),
    reserved_stock INT NOT NULL DEFAULT 0 CHECK (reserved_stock >= 0),
    low_stock_threshold INT NOT NULL DEFAULT 15,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    popular_rank INT DEFAULT 99,
    dietary VARCHAR(20) DEFAULT 'veg',
    calories INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. COUNTER SETTINGS
CREATE TABLE IF NOT EXISTS counter_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    counter_name VARCHAR(100) NOT NULL DEFAULT 'Main Serving Counter 1',
    serving_seconds_per_order INT NOT NULL DEFAULT 35,
    max_simultaneous_pickups INT NOT NULL DEFAULT 3,
    is_open BOOLEAN NOT NULL DEFAULT TRUE,
    rush_multiplier NUMERIC(3, 2) NOT NULL DEFAULT 1.0,
    auto_call_next BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ORDERS
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(20) NOT NULL UNIQUE, -- e.g. 'SF-1024'
    student_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    student_name VARCHAR(150) NOT NULL,
    department_id UUID REFERENCES departments(id),
    department_name VARCHAR(100) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    requested_break_start TIME NOT NULL,
    requested_break_end TIME NOT NULL,
    promised_pickup_time TIME NOT NULL,
    estimated_ready_time TIME NOT NULL,
    actual_ready_time TIMESTAMPTZ,
    called_time TIMESTAMPTZ,
    collected_time TIMESTAMPTZ,
    status VARCHAR(30) NOT NULL DEFAULT 'CONFIRMED' CHECK (
        status IN ('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'CALLED', 'COLLECTED', 'CANCELLED', 'DELAYED')
    ),
    delay_minutes INT DEFAULT 0,
    delay_reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id),
    name VARCHAR(150) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    prep_minutes INT NOT NULL,
    is_ready_made BOOLEAN NOT NULL DEFAULT FALSE
);

-- 8. PICKUP SLOTS (Capacity Planning)
CREATE TABLE IF NOT EXISTS pickup_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_date DATE NOT NULL,
    slot_start TIME NOT NULL,
    slot_end TIME NOT NULL,
    allocated_count INT DEFAULT 0,
    max_capacity INT DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(slot_date, slot_start)
);

-- 9. PREPARATION BATCHES (Kitchen Batching)
CREATE TABLE IF NOT EXISTS preparation_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id UUID NOT NULL REFERENCES menu_items(id),
    menu_item_name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    total_quantity INT NOT NULL CHECK (total_quantity > 0),
    orders_count INT NOT NULL DEFAULT 1,
    target_slot VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PREP', 'COMPLETED')),
    priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('CRITICAL', 'HIGH', 'NORMAL')),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. QUEUE ENTRIES (Live Counter Queue)
CREATE TABLE IF NOT EXISTS queue_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    token VARCHAR(20) NOT NULL,
    position INT NOT NULL,
    estimated_wait_seconds INT NOT NULL DEFAULT 60,
    is_called BOOLEAN NOT NULL DEFAULT FALSE,
    called_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. INVENTORY TRANSACTIONS (Stock Movement History)
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    menu_item_name VARCHAR(150) NOT NULL,
    change_quantity INT NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (
        type IN ('RESTOCK', 'ORDER_RESERVED', 'ORDER_FULFILLED', 'ORDER_CANCELLED', 'MANUAL_CORRECTION')
    ),
    reason TEXT NOT NULL,
    balance_after INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. DEMAND PREDICTIONS
CREATE TABLE IF NOT EXISTS demand_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    menu_item_name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    prediction_date DATE NOT NULL,
    slot_time VARCHAR(50) NOT NULL,
    predicted_quantity INT NOT NULL,
    actual_quantity INT DEFAULT 0,
    confidence_score INT NOT NULL CHECK (confidence_score BETWEEN 0 AND 100),
    department_breakdown JSONB NOT NULL DEFAULT '[]'::jsonb,
    manual_adjustment INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_role VARCHAR(20) NOT NULL CHECK (recipient_role IN ('student', 'kitchen', 'manager', 'all')),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('order', 'queue', 'stock', 'system', 'demand')),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    token VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. NOTIFICATION PREFERENCES
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    browser_push_enabled BOOLEAN DEFAULT TRUE,
    sound_enabled BOOLEAN DEFAULT TRUE,
    queue_approaching_enabled BOOLEAN DEFAULT TRUE,
    order_ready_enabled BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. ORDER STATUS HISTORY (Audit Trail)
CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    previous_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    changed_by_role VARCHAR(20) NOT NULL,
    changed_by_name VARCHAR(150),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR HIGH-THROUGHPUT QUEUE & SEARCH
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_student ON orders(student_id);
CREATE INDEX IF NOT EXISTS idx_orders_token ON orders(token);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_queue_position ON queue_entries(position);
CREATE INDEX IF NOT EXISTS idx_prep_batches_status ON preparation_batches(status);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_role, is_read);
CREATE INDEX IF NOT EXISTS idx_inv_tx_item ON inventory_transactions(menu_item_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read of active menu items" ON menu_items
    FOR SELECT USING (true);

CREATE POLICY "Allow managers to manage menu items" ON menu_items
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.auth_user_id = auth.uid() AND profiles.role = 'manager')
    );

CREATE POLICY "Allow students to read own orders" ON orders
    FOR SELECT USING (
        auth.uid() = student_id OR
        EXISTS (SELECT 1 FROM profiles WHERE profiles.auth_user_id = auth.uid() AND profiles.role IN ('kitchen', 'manager'))
    );
