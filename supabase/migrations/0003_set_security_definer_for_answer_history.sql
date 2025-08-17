-- Migration: mark add_design_request_answer_history as SECURITY DEFINER
-- This migration makes the existing DB function run with the function owner's
-- privileges so that it can perform inserts/updates that would otherwise be
-- blocked by Row-Level Security for anon/session roles. Apply this only if
-- you understand the security implications (the function should validate
-- inputs carefully and not expose unsafe behavior).

DO $$
BEGIN
	IF EXISTS (
		SELECT 1 FROM pg_proc p
		JOIN pg_namespace n ON p.pronamespace = n.oid
		WHERE p.proname = 'add_design_request_answer_history' AND n.nspname = 'public'
	) THEN
			RAISE NOTICE 'Setting SECURITY DEFINER for add_design_request_answer_history (discovering signature dynamically)';
			FOR r IN
				SELECT p.oid, pg_get_function_identity_arguments(p.oid) AS args
				FROM pg_proc p
				WHERE p.proname = 'add_design_request_answer_history'
			LOOP
				-- r.args contains the argument list in the exact form required by ALTER FUNCTION
				RAISE NOTICE 'Altering function with args: %', r.args;
				EXECUTE format('ALTER FUNCTION public.add_design_request_answer_history(%s) SECURITY DEFINER', r.args);
				-- Optionally change owner to postgres (adjust if your privileged role differs)
				EXECUTE format('ALTER FUNCTION public.add_design_request_answer_history(%s) OWNER TO postgres', r.args);
			END LOOP;
	ELSE
		RAISE NOTICE 'Function add_design_request_answer_history not found; skipping';
	END IF;
END$$;

-- Note: If your DB uses a different owner role, replace 'postgres' above with
-- the appropriate privileged role. Review the function body to ensure it
-- performs proper input validation and does not escalate privileges beyond
-- intended operations.

