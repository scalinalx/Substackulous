# Usage History Implementation

## Overview
Added the ability to track user actions in the app within a `usage_history` table in Supabase.

## Database Schema
The `usage_history` table structure is:
```sql
usage_history (
  id bigint primary key generated always as identity,
  user_email text references profiles (email),
  action text,
  credits_consumed integer,
  action_date timestamp with time zone default now()
)
```

## Implementation Steps
1. Add the `recordUsage` function to the AuthContext
2. Implement the function to record usage data to the Supabase database
3. Integrate the function in various app components, starting with the viral note generator
4. Ensure that topic/subject information is included in the action description

## Implementation Details

### Initial Implementation (Deprecated)
We initially created a standalone utility function in `src/lib/utils/usageTracker.ts` that accepted:
- `user_email`: The email of the user performing the action
- `action`: A descriptive string including details like the topic or subject
- `credits_consumed`: The number of credits used for the action

### Improved Implementation
After consideration, we moved the `recordUsage` function to the AuthContext, which:
- Aligns with the existing `updateCredits` function, creating a more cohesive API
- Eliminates the need to pass the user's email (already available in the context)
- Simplifies usage in components (they're already using the AuthContext)
- Makes function signature simpler with just two parameters:
  - `action`: A descriptive string including details like the topic or subject
  - `credits_consumed`: The number of credits used for the action

For the NotesRagContent component, we've implemented usage tracking with the action format:
`Generated viral notes on topic: {topic}`

## Progress
- [x] Add recordUsage to AuthContext
- [x] Integrate with NotesRagContent.tsx
- [ ] Test functionality
- [ ] Remove the standalone usageTracker.ts file
- [ ] Extend to other app features (ViralNoteGenerator, TitleGenerator, etc.)

## Next Steps
1. Test the implementation to ensure it works correctly
2. Remove the now-deprecated usageTracker.ts file
3. Add usage tracking to other features that consume credits
4. Create analytics dashboard to visualize usage data (future feature)

## Date: March 20, 2023
## Updated: March 20, 2023 