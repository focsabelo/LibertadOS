import { shouldResetPrivateDataForAuthChange } from "../src/lib/auth-state";

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, received ${actual}`);
  }
}

assertEqual(
  shouldResetPrivateDataForAuthChange("user-1", "user-1"),
  false,
  "auth refresh for the same user keeps private data in memory",
);

assertEqual(
  shouldResetPrivateDataForAuthChange("user-1", null),
  true,
  "sign out clears private data",
);

assertEqual(
  shouldResetPrivateDataForAuthChange("user-1", "user-2"),
  true,
  "switching accounts clears previous user data",
);

assertEqual(
  shouldResetPrivateDataForAuthChange(null, "user-1"),
  true,
  "signing in from a blank session loads the new user's data",
);
