// Twitter OAuth. Real OAuth 2.0 flow is non-trivial and requires a
// registered Twitter developer app. For v1 we scaffold the call sites but
// plug in a stub verifier; the production wiring is Task 3's /claim web
// app responsibility.
//
// The scaffold exists so that the API boundary is correct: routes that
// need a Twitter-verified handle consult this module; swapping the impl to
// the real OAuth flow doesn't change callers.

export interface TwitterVerifier {
  /**
   * Confirm that the caller presenting this token currently has an active
   * Twitter OAuth session for the claimed handle.
   *
   * In the stub, we accept any non-empty token and take the handle on faith
   * (only in dev builds). In production, the token is an OAuth access token
   * and the handle is looked up via the Twitter API.
   */
  verifyHandle(token: string, claimedHandle: string): Promise<boolean>;
}

export function createStubTwitterVerifier(): TwitterVerifier {
  return {
    async verifyHandle(token, claimedHandle) {
      // Reject empty tokens but otherwise trust — dev path only. Real
      // verifier rejects/accepts based on upstream Twitter API.
      if (!token || token.length < 8) return false;
      if (!claimedHandle || claimedHandle.length === 0) return false;
      return true;
    },
  };
}
