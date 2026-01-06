-- =====================================================
-- Test Transport Fee Payment Display
-- =====================================================

-- Step 1: Check the invoice
SELECT 
    id,
    invoice_number,
    student_id,
    total_amount,
    paid_amount,
    balance_amount,
    status
FROM fee_invoices
WHERE student_id = 8
ORDER BY created_at DESC
LIMIT 5;

-- Expected: Should show invoice #INV-2026-0001 with paid_amount = 4500

-- Step 2: Check invoice items
SELECT 
    i.id as item_id,
    i.invoice_id,
    inv.invoice_number,
    i.description,
    i.source_type,
    i.source_id,
    i.amount
FROM fee_invoice_items i
JOIN fee_invoices inv ON inv.id = i.invoice_id
WHERE inv.student_id = 8
ORDER BY inv.created_at DESC, i.id;

-- Expected: Should show 3 items including Transport Fee with source_type='TRANSPORT' and source_id=32

-- Step 3: Check if sourceType is being set correctly
SELECT 
    source_type,
    COUNT(*) as count,
    SUM(amount) as total_amount
FROM fee_invoice_items
WHERE invoice_id IN (
    SELECT id FROM fee_invoices WHERE student_id = 8
)
GROUP BY source_type;

-- Expected:
-- source_type | count | total_amount
-- FEE         | 2     | 1300.00
-- TRANSPORT   | 1     | 3200.00

-- Step 4: Calculate what transport received SHOULD be
SELECT 
    inv.invoice_number,
    inv.paid_amount as invoice_paid,
    inv.total_amount as invoice_total,
    i.description,
    i.source_type,
    i.amount as item_amount,
    ROUND((i.amount / inv.total_amount) * inv.paid_amount, 2) as allocated_payment
FROM fee_invoices inv
JOIN fee_invoice_items i ON i.invoice_id = inv.id
WHERE 
    inv.student_id = 8
    AND i.source_type = 'TRANSPORT'
ORDER BY inv.created_at DESC;

-- Expected for INV-2026-0001:
-- Transport Fee | 3200.00 | allocated_payment = (3200/4500)*4500 = 3200.00

-- Step 5: Verify the route price ID
SELECT 
    rp.id,
    rp.route_id,
    rp.class_id,
    rp.category_head_id,
    rp.amount,
    r.name as route_name
FROM route_prices rp
LEFT JOIN routes r ON r.id = rp.route_id
WHERE rp.id = 32;

-- Expected: Should show the route price details for ID 32

-- =====================================================
-- SUMMARY
-- =====================================================
-- If all above queries return expected data, the backend is correct.
-- The issue would be in frontend display logic or caching.

