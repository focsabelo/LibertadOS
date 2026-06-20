export function shouldResetPrivateDataForAuthChange(
  previousUserId: string | null,
  nextUserId: string | null,
) {
  return previousUserId !== nextUserId;
}
