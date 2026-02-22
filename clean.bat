@echo off
set FILTER_BRANCH_SQUELCH_WARNING=1
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch server/server.js server/test_hf.js" --prune-empty --tag-name-filter cat -- --all
