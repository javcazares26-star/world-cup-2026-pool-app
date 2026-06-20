-- Get All Participant Email Addresses

-- Option 1: If participants have a direct email column
SELECT DISTINCT email
FROM participants
ORDER BY email;

-- Option 2: If participants are linked through pool memberships
SELECT DISTINCT p.email
FROM participants p
JOIN pool_members pm ON p.id = pm.participant_id
ORDER BY p.email;

-- Option 3: Get emails with participant names (more detailed)
SELECT DISTINCT p.id, p.name, p.email
FROM participants p
ORDER BY p.name;

-- Option 4: Get emails grouped by pool
SELECT pools.code, pools.name, participants.email
FROM participants
JOIN pool_members ON participants.id = pool_members.participant_id
JOIN pools ON pool_members.pool_id = pools.id
ORDER BY pools.code, participants.email;

-- Option 5: Count participants per pool with emails
SELECT pools.code, COUNT(DISTINCT participants.id) as participant_count, STRING_AGG(DISTINCT participants.email, ', ') as emails
FROM participants
JOIN pool_members ON participants.id = pool_members.participant_id
JOIN pools ON pool_members.pool_id = pools.id
GROUP BY pools.code
ORDER BY pools.code;
