import React from "react";
import { Platform, View } from "react-native";
import { BannerAd, BannerAdSize, RequestOptions, TestIds } from "react-native-google-mobile-ads";
import { useAdsStore } from "@/features/ads/store";
import { getRequestOptions } from "@/lib/ads/consent";

const PlatformBannerAd = () => {
  const showBanner = useAdsStore((s) => s.showBanner);
  const adsRemoved = useAdsStore((s) => s.adsRemoved);
  const adsReady = useAdsStore((s) => s.adsReady);

  const BANNER_AD_UNIT_ID = __DEV__
    ? TestIds.ADAPTIVE_BANNER
    : Platform.select({
        ios: "ca-app-pub-1351324135516324/6034250878",
        android: "ca-app-pub-1351324135516324/6934067871",
      })!;

  // 同意は起動後に決まるため毎回取得し、キーで再マウントして反映する
  const requestOptions: RequestOptions = getRequestOptions();
  const bannerKey = requestOptions.requestNonPersonalizedAdsOnly ? 'npa' : 'pa';

  // 表示しない条件では描画しない（広告リクエストを抑止）
  if (!showBanner || adsRemoved || !adsReady) return null;

  return (
    <View>
      <BannerAd
        key={bannerKey}
        unitId={BANNER_AD_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={requestOptions}
      />
    </View>
  );
};

export default PlatformBannerAd;
