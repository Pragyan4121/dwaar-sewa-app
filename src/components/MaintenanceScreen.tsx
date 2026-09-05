import { Ionicons } from "@expo/vector-icons";
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export type MaintenanceSettings = {
  business_name?: string;
  support_email?: string;
  support_phone?: string;

  maintenance_badge?: string;
  maintenance_title?: string;
  maintenance_message?: string;

  maintenance_return_title?: string;
  maintenance_return_message?: string;

  maintenance_support_title?: string;

  maintenance_thank_you_title?: string;
  maintenance_thank_you_message?: string;

  maintenance_side_note?: string;
  maintenance_service_message?: string;

  maintenance_footer_item_1?: string;
  maintenance_footer_item_2?: string;
  maintenance_footer_item_3?: string;

  maintenance_brand_tagline?: string;
};

type MaintenanceScreenProps = {
  settings: MaintenanceSettings;
};

function getValue(value: string | undefined, fallback: string) {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : fallback;
}

export default function MaintenanceScreen({
  settings,
}: MaintenanceScreenProps) {
  const { width } = useWindowDimensions();

  const isMobile = width < 760;
  const isSmallMobile = width < 390;

  const businessName = getValue(settings.business_name, "Dwaar Sewa");

  const badge = getValue(settings.maintenance_badge, "Scheduled Maintenance");

  const title = getValue(settings.maintenance_title, "We’re Under Maintenance");

  const message = getValue(
    settings.maintenance_message,
    "We’re making Dwaar Sewa better for you. Customer and provider services are temporarily unavailable while we perform scheduled maintenance.",
  );

  const returnTitle = getValue(
    settings.maintenance_return_title,
    "We’ll be back soon",
  );

  const returnMessage = getValue(
    settings.maintenance_return_message,
    "Improving. Upgrading. Serving you better.",
  );

  const supportTitle = getValue(
    settings.maintenance_support_title,
    "Need urgent help? Contact support:",
  );

  const thankYouTitle = getValue(
    settings.maintenance_thank_you_title,
    "Thank you for your patience.",
  );

  const thankYouMessage = getValue(
    settings.maintenance_thank_you_message,
    "A better Dwaar Sewa is on the way!",
  );

  const sideNote = getValue(
    settings.maintenance_side_note,
    "Good services take a little extra time",
  );

  const serviceMessage = getValue(
    settings.maintenance_service_message,
    "Better Services Ahead",
  );

  const footerItem1 = getValue(
    settings.maintenance_footer_item_1,
    "Trusted Professionals",
  );

  const footerItem2 = getValue(
    settings.maintenance_footer_item_2,
    "Happier Homes",
  );

  const footerItem3 = getValue(
    settings.maintenance_footer_item_3,
    "Stronger Communities",
  );

  const brandTagline = getValue(
    settings.maintenance_brand_tagline,
    "Homes Happier. People Brighter.",
  );

  const supportEmail = getValue(settings.support_email, "");

  const supportPhone = getValue(settings.support_phone, "");

  const openEmail = async () => {
    if (!supportEmail) {
      return;
    }

    await Linking.openURL(`mailto:${supportEmail}`);
  };

  const openPhone = async () => {
    if (!supportPhone) {
      return;
    }

    const normalizedPhone = supportPhone.replace(/[^\d+]/g, "");

    await Linking.openURL(`tel:${normalizedPhone}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isMobile && styles.scrollContentMobile,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.backgroundBubbleOne} />
        <View style={styles.backgroundBubbleTwo} />
        <View style={styles.backgroundBubbleThree} />

        {/* TOP BRAND */}
        <View style={[styles.header, isMobile && styles.headerMobile]}>
          <View style={styles.brandRow}>
            <View style={styles.logoBox}>
              <Ionicons name="home-outline" size={24} color="#0f2f5f" />

              <View style={styles.logoHeart}>
                <Ionicons name="heart" size={11} color="#22a06b" />
              </View>
            </View>

            <View style={styles.brandTextWrap}>
              <Text style={styles.brandName}>{businessName}</Text>

              <Text style={styles.brandSubtitle}>
                SERVICES AT YOUR DOORSTEP
              </Text>
            </View>
          </View>

          {!isMobile && (
            <View style={styles.taglineWrap}>
              <Text style={styles.tagline}>{brandTagline}</Text>

              <View style={styles.taglineUnderline} />
            </View>
          )}
        </View>

        {/* MAIN CONTENT */}
        <View style={[styles.main, isMobile && styles.mainMobile]}>
          {/* ILLUSTRATION */}
          <View
            style={[
              styles.illustrationColumn,
              isMobile && styles.illustrationColumnMobile,
            ]}
          >
            <View style={styles.noteCard}>
              <Ionicons name="sparkles-outline" size={18} color="#22a06b" />

              <Text style={styles.noteText}>{sideNote}</Text>
            </View>

            <View style={styles.illustrationScene}>
              <View style={styles.gearLarge}>
                <Ionicons name="settings-outline" size={74} color="#c9d8e8" />
              </View>

              <View style={styles.gearSmall}>
                <Ionicons name="settings-outline" size={44} color="#dce7f1" />
              </View>

              <View style={styles.device}>
                <View style={styles.deviceTopBar}>
                  <View style={styles.deviceDot} />
                  <View style={styles.deviceDot} />
                  <View style={styles.deviceDot} />
                </View>

                <View style={styles.deviceContent}>
                  <View style={styles.deviceLogo}>
                    <Ionicons name="home-outline" size={34} color="#173765" />
                  </View>

                  <Text style={styles.deviceBrand}>{businessName}</Text>

                  <Text style={styles.deviceMessage}>{serviceMessage}</Text>

                  <View style={styles.progressTrack}>
                    <View style={styles.progressFill} />
                  </View>
                </View>
              </View>

              <View style={styles.worker}>
                <View style={styles.workerHead}>
                  <View style={styles.workerCap} />
                </View>

                <View style={styles.workerBody}>
                  <Ionicons
                    name="construct-outline"
                    size={31}
                    color="#ffffff"
                  />
                </View>

                <View style={styles.workerLegs}>
                  <View style={styles.workerLeg} />
                  <View style={styles.workerLeg} />
                </View>
              </View>

              <View style={styles.toolbox}>
                <Ionicons name="hammer-outline" size={25} color="#173765" />

                <Ionicons name="build-outline" size={23} color="#22a06b" />
              </View>

              <View style={styles.cone}>
                <View style={styles.coneTop} />
                <View style={styles.coneMiddle} />
                <View style={styles.coneBottom} />
              </View>

              <View style={styles.serviceVan}>
                <View style={styles.vanCab}>
                  <Ionicons name="home-outline" size={19} color="#173765" />
                </View>

                <View style={styles.vanBody}>
                  <Text style={styles.vanText}>BETTER</Text>

                  <Text style={styles.vanText}>SERVICE</Text>
                </View>

                <View style={styles.wheelOne} />
                <View style={styles.wheelTwo} />
              </View>
            </View>
          </View>

          {/* CONTENT */}
          <View
            style={[
              styles.contentColumn,
              isMobile && styles.contentColumnMobile,
            ]}
          >
            <View style={styles.badge}>
              <Ionicons name="settings-outline" size={15} color="#157347" />

              <Text style={styles.badgeText}>{badge}</Text>
            </View>

            <Text
              style={[
                styles.title,
                isMobile && styles.titleMobile,
                isSmallMobile && styles.titleSmall,
              ]}
            >
              {title}
            </Text>

            <Text style={[styles.message, isMobile && styles.messageMobile]}>
              {message}
            </Text>

            {/* RETURN STATUS */}
            <View style={styles.statusCard}>
              <View style={styles.statusIconBox}>
                <View style={styles.barRow}>
                  <View style={[styles.statusBar, { height: 12 }]} />
                  <View style={[styles.statusBar, { height: 20 }]} />
                  <View style={[styles.statusBar, { height: 29 }]} />
                </View>
              </View>

              <View style={styles.statusDivider} />

              <View style={styles.statusTextWrap}>
                <Text style={styles.statusTitle}>{returnTitle}</Text>

                <Text style={styles.statusMessage}>{returnMessage}</Text>
              </View>
            </View>

            {/* SUPPORT */}
            {(supportEmail || supportPhone) && (
              <View style={styles.supportCard}>
                <View style={styles.supportIcon}>
                  <Ionicons name="headset-outline" size={23} color="#16794f" />
                </View>

                <View style={styles.supportContent}>
                  <Text style={styles.supportTitle}>{supportTitle}</Text>

                  <View
                    style={[
                      styles.supportLinks,
                      isMobile && styles.supportLinksMobile,
                    ]}
                  >
                    {supportEmail ? (
                      <Pressable
                        onPress={() => void openEmail()}
                        style={({ pressed }) => [
                          styles.contactButton,
                          pressed && styles.contactButtonPressed,
                        ]}
                      >
                        <Ionicons
                          name="mail-outline"
                          size={15}
                          color="#173765"
                        />

                        <Text style={styles.contactText} numberOfLines={1}>
                          {supportEmail}
                        </Text>
                      </Pressable>
                    ) : null}

                    {supportPhone ? (
                      <Pressable
                        onPress={() => void openPhone()}
                        style={({ pressed }) => [
                          styles.contactButton,
                          pressed && styles.contactButtonPressed,
                        ]}
                      >
                        <Ionicons
                          name="call-outline"
                          size={15}
                          color="#173765"
                        />

                        <Text style={styles.contactText} numberOfLines={1}>
                          {supportPhone}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              </View>
            )}

            {/* THANK YOU */}
            <View style={styles.thankYouCard}>
              <View style={styles.thankYouIcon}>
                <Ionicons name="heart-outline" size={22} color="#173765" />
              </View>

              <View style={styles.thankYouTextWrap}>
                <Text style={styles.thankYouTitle}>{thankYouTitle}</Text>

                <Text style={styles.thankYouMessage}>{thankYouMessage}</Text>
              </View>

              {!isSmallMobile && (
                <Ionicons name="leaf-outline" size={30} color="#22a06b" />
              )}
            </View>
          </View>
        </View>

        {/* MOBILE TAGLINE */}
        {isMobile && (
          <View style={styles.mobileTagline}>
            <Text style={styles.mobileTaglineText}>{brandTagline}</Text>
          </View>
        )}

        {/* FOOTER */}
        <View style={[styles.footer, isMobile && styles.footerMobile]}>
          <View
            style={[styles.footerItems, isMobile && styles.footerItemsMobile]}
          >
            <View style={styles.footerItem}>
              <Ionicons
                name="shield-checkmark-outline"
                size={21}
                color="#64d49b"
              />

              <Text style={styles.footerItemText}>{footerItem1}</Text>
            </View>

            <View style={styles.footerItem}>
              <Ionicons name="people-outline" size={22} color="#64d49b" />

              <Text style={styles.footerItemText}>{footerItem2}</Text>
            </View>

            <View style={styles.footerItem}>
              <Ionicons name="leaf-outline" size={22} color="#64d49b" />

              <Text style={styles.footerItemText}>{footerItem3}</Text>
            </View>
          </View>

          <View
            style={[styles.footerBrand, isMobile && styles.footerBrandMobile]}
          >
            <Text style={styles.footerBrandName}>{businessName}</Text>

            <Text style={styles.footerBrandSub}>
              SERVICE. TRUST. COMMUNITY.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fbff",
  },

  scrollContent: {
    flexGrow: 1,
    position: "relative",
    overflow: "hidden",
    paddingTop: 18,
  },

  scrollContentMobile: {
    paddingTop: 8,
  },

  backgroundBubbleOne: {
    position: "absolute",
    width: 390,
    height: 390,
    borderRadius: 195,
    backgroundColor: "#eef6fc",
    left: -170,
    top: 80,
  },

  backgroundBubbleTwo: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "#ecf9f2",
    right: -110,
    top: 90,
  },

  backgroundBubbleThree: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#f1f6fb",
    right: 160,
    bottom: 90,
  },

  header: {
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
    paddingHorizontal: 32,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 2,
  },

  headerMobile: {
    paddingHorizontal: 18,
    paddingVertical: 12,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  logoBox: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dbe6ef",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0f2f5f",
    shadowOpacity: Platform.OS === "web" ? 0.06 : 0.1,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 2,
  },

  logoHeart: {
    position: "absolute",
    right: 8,
    bottom: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#e8f8ef",
    alignItems: "center",
    justifyContent: "center",
  },

  brandTextWrap: {
    marginLeft: 11,
  },

  brandName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#132f57",
    letterSpacing: -0.4,
  },

  brandSubtitle: {
    marginTop: 2,
    fontSize: 8,
    fontWeight: "700",
    color: "#70839a",
    letterSpacing: 1.15,
  },

  taglineWrap: {
    alignItems: "flex-end",
    maxWidth: 260,
  },

  tagline: {
    fontSize: 15,
    fontWeight: "600",
    color: "#476178",
  },

  taglineUnderline: {
    marginTop: 6,
    width: 58,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#22a06b",
  },

  main: {
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
    paddingHorizontal: 32,
    paddingTop: 38,
    paddingBottom: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: 70,
    zIndex: 2,
  },

  mainMobile: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 30,
    flexDirection: "column",
    gap: 18,
  },

  illustrationColumn: {
    width: "45%",
    minHeight: 470,
    justifyContent: "center",
  },

  illustrationColumnMobile: {
    width: "100%",
    minHeight: 330,
  },

  noteCard: {
    alignSelf: "flex-start",
    marginLeft: 10,
    marginBottom: 5,
    maxWidth: 245,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e3edf5",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  noteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
    color: "#607589",
  },

  illustrationScene: {
    height: 390,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },

  gearLarge: {
    position: "absolute",
    left: "7%",
    top: 32,
  },

  gearSmall: {
    position: "absolute",
    right: "8%",
    top: 50,
  },

  device: {
    width: 205,
    height: 282,
    borderRadius: 28,
    backgroundColor: "#ffffff",
    borderWidth: 7,
    borderColor: "#173765",
    overflow: "hidden",
    shadowColor: "#173765",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    elevation: 4,
  },

  deviceTopBar: {
    height: 26,
    backgroundColor: "#f1f6fb",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    gap: 5,
  },

  deviceDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#b8c8d9",
  },

  deviceContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  deviceLogo: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: "#eff6fb",
    alignItems: "center",
    justifyContent: "center",
  },

  deviceBrand: {
    marginTop: 13,
    fontSize: 16,
    fontWeight: "800",
    color: "#173765",
  },

  deviceMessage: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "600",
    color: "#6d8194",
    textAlign: "center",
  },

  progressTrack: {
    width: "78%",
    height: 7,
    borderRadius: 4,
    backgroundColor: "#e7eef5",
    overflow: "hidden",
    marginTop: 18,
  },

  progressFill: {
    width: "68%",
    height: "100%",
    backgroundColor: "#22a06b",
    borderRadius: 4,
  },

  worker: {
    position: "absolute",
    right: "5%",
    bottom: 60,
    alignItems: "center",
  },

  workerHead: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ddb38e",
    position: "relative",
  },

  workerCap: {
    width: 47,
    height: 15,
    borderRadius: 9,
    backgroundColor: "#173765",
    position: "absolute",
    top: -4,
    left: -4,
  },

  workerBody: {
    marginTop: -2,
    width: 72,
    height: 88,
    borderRadius: 20,
    backgroundColor: "#224a78",
    alignItems: "center",
    justifyContent: "center",
  },

  workerLegs: {
    flexDirection: "row",
    gap: 9,
  },

  workerLeg: {
    width: 22,
    height: 54,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: "#173765",
  },

  toolbox: {
    position: "absolute",
    left: "7%",
    bottom: 40,
    width: 88,
    height: 57,
    borderRadius: 12,
    backgroundColor: "#eef3f7",
    borderWidth: 1,
    borderColor: "#d6e1eb",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
  },

  cone: {
    position: "absolute",
    left: "27%",
    bottom: 22,
    alignItems: "center",
  },

  coneTop: {
    width: 0,
    height: 0,
    borderLeftWidth: 17,
    borderRightWidth: 17,
    borderBottomWidth: 47,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#f97316",
  },

  coneMiddle: {
    width: 39,
    height: 8,
    backgroundColor: "#ffffff",
    marginTop: -22,
  },

  coneBottom: {
    width: 48,
    height: 9,
    backgroundColor: "#f97316",
    borderRadius: 3,
    marginTop: 16,
  },

  serviceVan: {
    position: "absolute",
    right: "12%",
    bottom: 10,
    width: 115,
    height: 65,
    flexDirection: "row",
  },

  vanCab: {
    width: 40,
    height: 48,
    marginTop: 11,
    backgroundColor: "#eaf1f6",
    borderTopLeftRadius: 13,
    borderBottomLeftRadius: 8,
    borderWidth: 1,
    borderColor: "#d1dee9",
    alignItems: "center",
    justifyContent: "center",
  },

  vanBody: {
    width: 75,
    height: 58,
    backgroundColor: "#ffffff",
    borderTopRightRadius: 12,
    borderWidth: 1,
    borderColor: "#d1dee9",
    alignItems: "center",
    justifyContent: "center",
  },

  vanText: {
    fontSize: 8,
    fontWeight: "800",
    color: "#173765",
  },

  wheelOne: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#173765",
    left: 22,
    bottom: -2,
  },

  wheelTwo: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#173765",
    right: 12,
    bottom: -2,
  },

  contentColumn: {
    flex: 1,
    maxWidth: 580,
  },

  contentColumnMobile: {
    width: "100%",
    maxWidth: "100%",
  },

  badge: {
    alignSelf: "flex-start",
    minHeight: 34,
    paddingHorizontal: 13,
    borderRadius: 17,
    backgroundColor: "#e8f8ef",
    borderWidth: 1,
    borderColor: "#c7eed9",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  badgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#157347",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  title: {
    marginTop: 18,
    fontSize: 54,
    lineHeight: 59,
    fontWeight: "900",
    color: "#102e57",
    letterSpacing: -2.2,
  },

  titleMobile: {
    fontSize: 39,
    lineHeight: 44,
    letterSpacing: -1.4,
  },

  titleSmall: {
    fontSize: 33,
    lineHeight: 38,
  },

  message: {
    marginTop: 18,
    maxWidth: 530,
    fontSize: 15,
    lineHeight: 25,
    color: "#61768a",
    fontWeight: "500",
  },

  messageMobile: {
    fontSize: 14,
    lineHeight: 23,
  },

  statusCard: {
    marginTop: 25,
    minHeight: 82,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: "#f4f7fa",
    borderWidth: 1,
    borderColor: "#e2eaf1",
    flexDirection: "row",
    alignItems: "center",
  },

  statusIconBox: {
    width: 55,
    alignItems: "center",
  },

  barRow: {
    height: 32,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
  },

  statusBar: {
    width: 6,
    borderRadius: 4,
    backgroundColor: "#22a06b",
  },

  statusDivider: {
    width: 1,
    height: 42,
    backgroundColor: "#d9e3eb",
    marginHorizontal: 16,
  },

  statusTextWrap: {
    flex: 1,
  },

  statusTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#173765",
  },

  statusMessage: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: "#718496",
  },

  supportCard: {
    marginTop: 14,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#eaf8f1",
    borderWidth: 1,
    borderColor: "#cfeedd",
    flexDirection: "row",
    alignItems: "flex-start",
  },

  supportIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },

  supportContent: {
    flex: 1,
    marginLeft: 13,
  },

  supportTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#587168",
  },

  supportLinks: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  supportLinksMobile: {
    flexDirection: "column",
  },

  contactButton: {
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d8e9df",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  contactButtonPressed: {
    opacity: 0.65,
  },

  contactText: {
    maxWidth: 220,
    fontSize: 11,
    fontWeight: "700",
    color: "#173765",
  },

  thankYouCard: {
    marginTop: 14,
    minHeight: 78,
    padding: 15,
    borderRadius: 20,
    backgroundColor: "#eef5fb",
    borderWidth: 1,
    borderColor: "#dce8f2",
    flexDirection: "row",
    alignItems: "center",
  },

  thankYouIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },

  thankYouTextWrap: {
    flex: 1,
    marginHorizontal: 12,
  },

  thankYouTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#173765",
  },

  thankYouMessage: {
    marginTop: 3,
    fontSize: 11,
    color: "#728599",
  },

  mobileTagline: {
    marginHorizontal: 18,
    marginBottom: 20,
    paddingVertical: 13,
    paddingHorizontal: 15,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e3ebf2",
  },

  mobileTaglineText: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "700",
    color: "#526b80",
  },

  footer: {
    marginTop: "auto",
    minHeight: 105,
    paddingHorizontal: 34,
    paddingVertical: 26,
    backgroundColor: "#102f5d",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  footerMobile: {
    minHeight: 0,
    paddingHorizontal: 18,
    paddingVertical: 25,
    flexDirection: "column",
    alignItems: "stretch",
  },

  footerItems: {
    flexDirection: "row",
    alignItems: "center",
    gap: 28,
  },

  footerItemsMobile: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 14,
  },

  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  footerItemText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#eef7ff",
  },

  footerBrand: {
    alignItems: "flex-end",
  },

  footerBrandMobile: {
    marginTop: 24,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: "#2a4971",
    alignItems: "flex-start",
  },

  footerBrandName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#ffffff",
  },

  footerBrandSub: {
    marginTop: 3,
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1,
    color: "#90a8c1",
  },
});
