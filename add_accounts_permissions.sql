-- إضافة صلاحيات حساباتي للموظفين الإداريين الموجودين
INSERT INTO employee_permissions (employee_id, permission, granted_by, granted_at)
SELECT 
    e.id,
    perm.permission,
    'system' as granted_by,
    NOW() as granted_at
FROM employees e
CROSS JOIN (
    SELECT 'accounts_view' as permission
    UNION ALL
    SELECT 'accounts_manage' as permission  
    UNION ALL
    SELECT 'accounts_reports' as permission
) perm
WHERE e.role IN ('admin', 'manager')
AND NOT EXISTS (
    SELECT 1 
    FROM employee_permissions ep 
    WHERE ep.employee_id = e.id 
    AND ep.permission = perm.permission
);
