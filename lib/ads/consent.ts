let shouldNPA = false;

export function setConsent(npa: boolean) {
  shouldNPA = npa;
}

export function getRequestOptions() {
  return {
    requestNonPersonalizedAdsOnly: shouldNPA,
  };
}
