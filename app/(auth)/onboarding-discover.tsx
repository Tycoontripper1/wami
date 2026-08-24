import Colors from "@/constants/Colors";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");
const PRIMARY = Colors.light.primary;

// ─── animation hook with slower, sleeker motion ──────────────────────────────────────────────────────────
function useFlyIn(
  dx: number,
  dy: number,
  delay: number,
  trigger: number,
  duration: number = 800, // increased from 500
  springConfig?: { speed: number; bounciness: number },
) {
  const trans = useRef(new Animated.ValueXY({ x: dx, y: dy })).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    trans.setValue({ x: dx, y: dy });
    opacity.setValue(0);

    // Use easing for smoother motion
    const anim = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: duration * 0.6,
        delay,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1), // smooth cubic bezier
        useNativeDriver: true,
      }),
      Animated.spring(trans, {
        toValue: { x: 0, y: 0 },
        speed: springConfig?.speed ?? 8, // slower speed
        bounciness: springConfig?.bounciness ?? 4, // less bounce
        delay,
        useNativeDriver: true,
        restSpeedThreshold: 0.5, // smoother stop
        restDisplacementThreshold: 0.5,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [trigger]);

  return { transform: trans.getTranslateTransform(), opacity };
}

// ─── SLIDE 1 ─────────────────────────────────────────────────────────────────
function Slide1Visual({
  trigger,
  isDark,
}: {
  trigger: number;
  isDark: boolean;
}) {
  // Slower, more elegant entries with longer delays between elements
  const card1 = useFlyIn(0, height * 0.35, 0, trigger, 900, {
    speed: 6,
    bounciness: 3,
  });
  const card2 = useFlyIn(width * 0.4, -height * 0.08, 250, trigger, 800, {
    speed: 7,
    bounciness: 3.5,
  });
  const card3 = useFlyIn(-width * 0.4, height * 0.1, 450, trigger, 800, {
    speed: 7,
    bounciness: 3.5,
  });
  const locBadge = useFlyIn(0, -30, 650, trigger, 700, {
    speed: 8,
    bounciness: 3,
  });
  const peoplePill = useFlyIn(0, 30, 780, trigger, 700, {
    speed: 8,
    bounciness: 3,
  });

  return (
    <View style={s1.wrapper}>
      {/* frame2 — top-right accent, rotated right */}
      <Animated.View
        style={[s1.card, s1.card2, card2, { opacity: card2.opacity }]}
      >
        <Image
          source={require("@/assets/images/onboard1/frame2.png")}
          style={s1.img}
          resizeMode="cover"
        />
      </Animated.View>

      {/* frame3 — bottom-left accent, rotated left */}
      <Animated.View
        style={[s1.card, s1.card3, card3, { opacity: card3.opacity }]}
      >
        <Image
          source={require("@/assets/images/onboard1/frame3.png")}
          style={s1.img}
          resizeMode="cover"
        />
      </Animated.View>

      {/* frame1 — large hero card, centred on top */}
      <Animated.View
        style={[s1.card, s1.card1, card1, { opacity: card1.opacity }]}
      >
        <Image
          source={require("@/assets/images/onboard1/frame1.png")}
          style={s1.img}
          resizeMode="cover"
        />
      </Animated.View>

      {/* Location badge — top area of hero card */}
      <Animated.View
        style={[s1.locBadge, locBadge, { opacity: locBadge.opacity }]}
      >
        <Image
          source={require("@/assets/images/onboard1/location.png")}
          style={s1.locImg}
          resizeMode="contain"
        />
      </Animated.View>

      {/* People pill — bottom-right corner */}
      <Animated.View
        style={[s1.peoplePill, peoplePill, { opacity: peoplePill.opacity }]}
      >
        <Image
          source={require("@/assets/images/onboard1/people.png")}
          style={s1.peopleImg}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const s1 = StyleSheet.create({
  wrapper: {
    flex: 1,
    width: width,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: height * 0.04,
    paddingBottom: height * 0.02,
  },
  card: {
    position: "absolute",
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  card1: {
    width: width * 0.58,
    height: height * 0.36,
    alignSelf: "center",
    zIndex: 3,
  },
  card2: {
    width: width * 0.38,
    height: height * 0.24,
    top: height * 0.2,
    right: width * 0.05,
    transform: [{ rotate: "9deg" }],
    zIndex: 2,
  },
  card3: {
    width: width * 0.36,
    height: height * 0.22,
    bottom: height * 0.099,
    left: width * 0.05,
    transform: [{ rotate: "-9deg" }],
    zIndex: 1,
  },
  img: { width: "100%", height: "100%" },
  locBadge: {
    position: "absolute",
    top: height * 0.12,
    right: width * 0.05,
    zIndex: 10,
  },
  locImg: { width: 80, height: 28 },
  peoplePill: {
    position: "absolute",
    bottom: 120,
    right: width * 0.06,
    zIndex: 10,
  },
  peopleImg: { width: 90, height: 32 },
});

// ─── SLIDE 2 ─────────────────────────────────────────────────────────────────
function Slide2Visual({
  trigger,
  isDark,
}: {
  trigger: number;
  isDark: boolean;
}) {
  const phone = useFlyIn(0, height * 0.25, 0, trigger, 900, {
    speed: 6,
    bounciness: 3,
  });
  const badge = useFlyIn(width * 0.45, -40, 350, trigger, 800, {
    speed: 7,
    bounciness: 3.5,
  });
  const stat = useFlyIn(-width * 0.45, 30, 520, trigger, 800, {
    speed: 7,
    bounciness: 3.5,
  });

  return (
    <View style={s2.wrapper}>
      {/* Phone / profile mockup card */}
      <Animated.View style={[s2.phoneCard, phone, { opacity: phone.opacity }]}>
        <Image
          source={require("@/assets/images/onboard2/insta.png")}
          style={s1.img}
          resizeMode="cover"
        />
        <View
          style={[
            s2.overlay,
            {
              backgroundColor: isDark
                ? "rgba(30,30,30,0.92)"
                : "rgba(255,255,255,0.88)",
            },
          ]}
        >
          <View style={s2.profileRow}>
            <View
              style={[s2.avatar, { backgroundColor: isDark ? "#444" : "#DDD" }]}
            />
            <View>
              <Text style={[s2.handle, { color: isDark ? "#fff" : "#111" }]}>
                @creativesola
              </Text>
              <Text style={s2.synoid}>Synoid ✓</Text>
            </View>
          </View>
          <View style={s2.grid}>
            {[
              "#E8D5C4",
              "#C4D8E8",
              "#D4E8C4",
              "#E8C4D4",
              "#C4E8E4",
              "#E8E4C4",
            ].map((bg, i) => (
              <View key={i} style={[s2.cell, { backgroundColor: bg }]} />
            ))}
          </View>
        </View>
      </Animated.View>

      {/* Synoid badge top-right */}
      <Animated.View style={[s2.badge, badge, { opacity: badge.opacity }]}>
        <Text style={s2.badgeText}>Synoid</Text>
      </Animated.View>

      {/* Stats pill bottom-left */}
      <Animated.View
        style={[
          s2.statPill,
          stat,
          { opacity: stat.opacity, backgroundColor: isDark ? "#222" : "#fff" },
        ]}
      >
        <Text style={[s2.statText, { color: isDark ? "#fff" : "#111" }]}>
          ₦94,500 · Top Rated
        </Text>
      </Animated.View>
    </View>
  );
}

const s2 = StyleSheet.create({
  wrapper: {
    width: width,
    height: height * 0.4,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: height * 0.25,
    paddingBottom: height * 0.02,
  },
  phoneCard: {
    width: width * 0.62,
    height: height * 0.45,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  overlay: {
    flex: 1,
    padding: 14,
    justifyContent: "space-between",
  },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  handle: { fontSize: 13, fontWeight: "700" },
  synoid: { fontSize: 11, color: PRIMARY, fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  cell: {
    width: (width * 0.62 - 28 - 8) / 3,
    height: (width * 0.62 - 28 - 8) / 3,
    borderRadius: 8,
  },
  badge: {
    position: "absolute",
    top: 100,
    right: width * 0.07,
    backgroundColor: PRIMARY,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  badgeText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  statPill: {
    position: "absolute",
    bottom: -40,
    left: width * 0.06,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  statText: { fontSize: 12, fontWeight: "700" },
});

// ─── SLIDE 3 ─────────────────────────────────────────────────────────────────
function Slide3Visual({
  trigger,
  isDark,
}: {
  trigger: number;
  isDark: boolean;
}) {
  const product = useFlyIn(0, -height * 0.2, 0, trigger, 900, {
    speed: 6,
    bounciness: 3,
  });
  const row1 = useFlyIn(-width * 0.6, 0, 380, trigger, 800, {
    speed: 7,
    bounciness: 3,
  });
  const row2 = useFlyIn(width * 0.6, 0, 520, trigger, 800, {
    speed: 7,
    bounciness: 3,
  });
  const badge = useFlyIn(40, -40, 200, trigger, 700, {
    speed: 8,
    bounciness: 3,
  });

  return (
    <View style={s3.wrapper}>
      {/* Product image card */}
      <Animated.View
        style={[s3.productCard, product, { opacity: product.opacity }]}
      >
        <Image
          source={require("@/assets/images/onboard3/bag.jpg")}
          style={s3.productImg}
          resizeMode="cover"
        />
        {/* Delivered badge */}
        <Animated.View
          style={[s3.deliveredBadge, badge, { opacity: badge.opacity }]}
        >
          <Text style={s3.deliveredText}>✓ Delivered</Text>
        </Animated.View>
      </Animated.View>
      {/* Escrow rows */}
      <View
        style={[s3.escrowCard, { backgroundColor: isDark ? "#222" : "#fff" }]}
      >
        <Animated.View style={[s3.escrowRow, row1, { opacity: row1.opacity }]}>
          <View
            style={[
              s3.escrowAvatar,
              { backgroundColor: isDark ? "#2D3E2D" : "#C8E6C9" },
            ]}
          />
          <View style={{ flex: 1 }}>
            <Text style={[s3.escrowName, { color: isDark ? "#fff" : "#222" }]}>
              Bastion – Protected
            </Text>
            <Text style={s3.escrowSub}>
              Pay now, sender gets paid after delivery
            </Text>
          </View>
          <Text style={s3.escrowAmount}>₦ 15,000</Text>
        </Animated.View>
        <View
          style={[s3.divider, { backgroundColor: isDark ? "#333" : "#F0F0F0" }]}
        />

        <Animated.View style={[s3.escrowRow, row2, { opacity: row2.opacity }]}>
          <View
            style={[
              s3.escrowAvatar,
              { backgroundColor: isDark ? "#2D333E" : "#BBDEFB" },
            ]}
          />
          <View style={{ flex: 1 }}>
            <Text style={[s3.escrowName, { color: isDark ? "#fff" : "#222" }]}>
              Chidis Accessory
            </Text>
            <Text style={s3.escrowSub}>Honda CB125 . LAG-442-1B</Text>
          </View>
          <Text style={s3.escrowAmount}>4.9⭐</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const s3 = StyleSheet.create({
  wrapper: {
    width: width,
    height: height * 0.46,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    paddingHorizontal: 28,
    paddingTop: height * 0.2,
  },
  productCard: {
    width: "85%",
    height: height * 0.36,
    top: 30,
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  productImg: { width: "100%", height: "100%" },
  deliveredBadge: {
    position: "absolute",
    top: 12,
    right: 2,
    backgroundColor: "#008000F7",
    borderRadius: 50,
    paddingHorizontal: 15,
    paddingVertical: 10,
    zIndex: 1,
  },
  deliveredText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  escrowCard: {
    width: "100%",
    borderRadius: 18,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
    gap: 4,
  },
  escrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#00000014",
    paddingHorizontal: 12.7,
    paddingVertical: 6.7,
    borderRadius: 8,
  },
  escrowAvatar: { width: 36, height: 36, borderRadius: 18 },
  escrowName: { fontSize: 13, fontWeight: "700" },
  escrowSub: { fontSize: 11, color: "#888", marginTop: 1 },
  escrowAmount: { fontSize: 14, fontWeight: "800", color: "#000000" },
  divider: { height: 1, marginVertical: 4 },
});

// ─── Slide data ───────────────────────────────────────────────────────────────
const SLIDES = [
  {
    id: "1",
    Component: Slide1Visual,
    title: "Creatives, not chance",
    subtitle:
      "Photographers, MUAs, stylists, chefs – every creative verified, ranked by what you actually need.",
  },
  {
    id: "2",
    Component: Slide2Visual,
    title: "Built for how you\nalready work",
    subtitle:
      "Connect your Instagram. Your feed becomes your portfolio. Set rates, take bookings, get paid all in one place.",
  },
  {
    id: "3",
    Component: Slide3Visual,
    title: "From their hands to\nyours",
    subtitle:
      "Escrow protected payments. Wami Drivers handles delivery. You just show up ready.",
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function OnboardingDiscoverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [currentIndex, setCurrentIndex] = useState(0);
  const [trigger, setTrigger] = useState(0);

  const themeColors = {
    background: isDark ? "#000" : "#fff",
    text: isDark ? "#fff" : "#111",
    subText: isDark ? "#aaa" : "#777",
    sheet: isDark ? "#1a1a1a" : "#fff",
    dot: isDark ? "#333" : "#DDD",
    border: isDark ? "#333" : "#DDD",
  };

  // Sheet slide-up animation with smoother easing
  const sheetY = useRef(new Animated.Value(80)).current;
  const sheetOpacity = useRef(new Animated.Value(0)).current;

  const animateSheet = useCallback(() => {
    sheetY.setValue(80);
    sheetOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(sheetY, {
        toValue: 0,
        speed: 10,
        bounciness: 3,
        useNativeDriver: true,
        restSpeedThreshold: 0.5,
        restDisplacementThreshold: 0.5,
      }),
      Animated.timing(sheetOpacity, {
        toValue: 1,
        duration: 450,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    animateSheet();
    setTrigger((t) => t + 1);
  }, [currentIndex]);

  const goTo = (next: number) => {
    setCurrentIndex(next);
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      goTo(currentIndex + 1);
    } else {
      router.push("./onboarding-purpose" as any);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) goTo(currentIndex - 1);
  };

  const slide = SLIDES[currentIndex];
  const SlideVisual = slide.Component;
  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <View
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={themeColors.background}
      />
      {/* Visual area – white/dark bg, animations play here */}
      <View
        style={[styles.visualArea, { backgroundColor: themeColors.background }]}
      >
        <SlideVisual trigger={trigger} isDark={isDark} />

        {/* Global Skip button */}
        <TouchableOpacity
          onPress={() => router.replace("./sign-in" as any)}
          style={[styles.globalSkip, { top: insets.top + 10 }]}
        >
          <Text style={[styles.globalSkipText, { color: themeColors.subText }]}>
            Skip
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bottom sheet slides up on each change */}
      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: themeColors.sheet,
            paddingBottom: insets.bottom + 24,
            transform: [{ translateY: sheetY }],
            opacity: sheetOpacity,
          },
        ]}
      >
        {/* Dot indicators */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i === currentIndex ? PRIMARY : themeColors.dot,
                },
                i === currentIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>
        <Text style={[styles.title, { color: themeColors.text }]}>
          {slide.title}
        </Text>
        <Text style={[styles.subtitle, { color: themeColors.subText }]}>
          {slide.subtitle}
        </Text>
        <View style={styles.footer}>
          {currentIndex > 0 ? (
            <TouchableOpacity
              onPress={handleBack}
              style={[styles.backButton, { borderColor: themeColors.border }]}
            >
              <Text style={[styles.backText, { color: themeColors.text }]}>
                Back
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
            <Text style={styles.nextText}>
              {isLast ? "Get Started" : "Next"}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  visualArea: {
    flex: 1,
    overflow: "hidden",
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 10,
  },
  dots: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
  },
  dot: {
    height: 5,
    borderRadius: 3,
    width: 5,
  },
  dotActive: { width: 22, backgroundColor: PRIMARY },
  title: {
    fontSize: 26,
    fontWeight: "700",
    lineHeight: 34,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 26,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: "center",
  },
  backText: { fontSize: 16, fontWeight: "600" },
  nextButton: {
    flex: 2,
    backgroundColor: PRIMARY,
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: "center",
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  nextText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  globalSkip: {
    position: "absolute",
    right: 24,
    padding: 8,
    zIndex: 100,
  },
  globalSkipText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
