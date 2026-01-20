import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Image,
  TouchableOpacity,
  Linking,
  Alert,
  Modal,
  Animated,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Search, X, ShoppingCart } from "lucide-react-native";
import { useTheme } from "@/providers/ThemeProvider";
import { useData } from "@/providers/DataProvider";
import { useAuth } from "@/providers/AuthProvider";

import { Product, Category } from "@/types";
import ProductCard from "@/components/ProductCard";
import CategoryChip from "@/components/CategoryChip";
import PromotionCarousel from "@/components/PromotionCarousel";
import { useCart } from "@/providers/CartProvider";
import AddToCartSuccessModal from "@/components/AddToCartSuccessModal";

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { addItem } = useCart();

  const { products, categories, promotions, marketingPopup, isAnyBranchOpen, getNextOpenTime, getWhatsAppUrl, forceSyncBranches } = useData();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [cartNotification, setCartNotification] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const notificationOpacity = useState(new Animated.Value(0))[0];
  const [anyBranchOpen, setAnyBranchOpen] = useState(true);
  const [nextOpenTime, setNextOpenTime] = useState('Próximamente');

  useEffect(() => {
    const checkStoreStatus = () => {
      const anyOpen = isAnyBranchOpen();
      const time = getNextOpenTime();
      setAnyBranchOpen(anyOpen);
      setNextOpenTime(time);
      console.log('🕐 [STORE STATUS] Any branch open:', anyOpen, '- Next open:', time);
    };

    checkStoreStatus();
    const interval = setInterval(checkStoreStatus, 60000);
    return () => clearInterval(interval);
  }, [isAnyBranchOpen, getNextOpenTime]);

  useEffect(() => {
    if (user?.role === 'admin') {
      console.log('🔄 [ADMIN LOGIN] Admin logged in, forcing branches sync from Firebase...');
      forceSyncBranches();
    }
  }, [user, forceSyncBranches]);



  useEffect(() => {
    if (marketingPopup?.isActive && marketingPopup.image) {
      setShowPopup(true);
      const timer = setTimeout(() => {
        setShowPopup(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [marketingPopup]);

  useEffect(() => {
    if (cartNotification) {
      Animated.sequence([
        Animated.timing(notificationOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(notificationOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setCartNotification(null));
    }
  }, [cartNotification, notificationOpacity]);

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory
      ? product.categoryId === selectedCategory
      : true;
    const matchesSearch = searchText
      ? product.name.toLowerCase().includes(searchText.toLowerCase())
      : true;
    return matchesCategory && matchesSearch && product.available;
  });

  const handleAddToCart = useCallback(
    (product: Product) => {
      const anyOpen = isAnyBranchOpen();
      
      if (!anyOpen) {
        Alert.alert(
          "Local Cerrado",
          `Nuestro horario de atención será Próximamente. \u00a1Te esperamos!`,
          [{ text: "Entendido" }]
        );
        return;
      }
      if (product.isCombo && product.comboType === "personal" && product.includesDrink) {
        router.push(`/product/${product.id}` as any);
      } else {
        addItem(product);
        setShowSuccessModal(true);
      }
    },
    [addItem, router, isAnyBranchOpen]
  );

  const handleWhatsApp = useCallback((product: Product) => {
    const url = getWhatsAppUrl(product);
    Linking.openURL(url);
  }, [getWhatsAppUrl]);

  const handleProductPress = useCallback((product: Product) => {
    router.push(`/product/${product.id}` as any);
  }, [router]);

  const handlePopupPress = useCallback(() => {
    if (marketingPopup?.productId) {
      setShowPopup(false);
      router.push(`/product/${marketingPopup.productId}` as any);
    }
  }, [marketingPopup, router]);

  const handlePromotionPress = useCallback(
    (promotion: any) => {
      if (promotion.action === "category" && promotion.targetId) {
        setSelectedCategory(promotion.targetId);
      } else if (promotion.action === "product" && promotion.targetId) {
        router.push(`/product/${promotion.targetId}` as any);
      }
    },
    [router]
  );

  const sortCategories = (cats: Category[]) => {
    const lastCategories = ['complementos', 'refrescos', 'refrescos naturales'];
    return [...cats].sort((a, b) => {
      const aIsLast = lastCategories.some(name => a.name.toLowerCase().includes(name));
      const bIsLast = lastCategories.some(name => b.name.toLowerCase().includes(name));
      
      if (aIsLast && !bIsLast) return 1;
      if (!aIsLast && bIsLast) return -1;
      
      return a.order - b.order;
    });
  };

  const groupedProducts = sortCategories(categories)
    .map((category) => ({
      category,
      products: filteredProducts.filter((p) => p.categoryId === category.id),
    }))
    .filter((group) => group.products.length > 0);

  const styles = createStyles(colors);

  const renderListHeader = () => (
    <View>
      <PromotionCarousel promotions={promotions} onPress={handlePromotionPress} />

      <View style={styles.categoriesSection}>
        <Text style={styles.sectionTitle}>Categorías</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        >
          <CategoryChip
            category={{ id: "all", name: "Todo", icon: "package", order: 0 }}
            isSelected={selectedCategory === null}
            onPress={() => setSelectedCategory(null)}
          />
          {sortCategories(categories).map((category) => (
            <CategoryChip
              key={category.id}
              category={category}
              isSelected={selectedCategory === category.id}
              onPress={() => setSelectedCategory(category.id)}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );

  const renderCategorySection = ({
    item,
  }: {
    item: { category: Category; products: Product[] };
  }) => (
    <View style={styles.categorySection}>
      <Text style={styles.categoryTitle}>{item.category.name}</Text>
      <View style={styles.productsGrid}>
        {item.products.map((product) => (
          <View key={product.id} style={styles.productWrapper}>
            <ProductCard
              product={product}
              onAddToCart={handleAddToCart}
              onWhatsApp={handleWhatsApp}
              onProductPress={handleProductPress}
            />
          </View>
        ))}
      </View>
    </View>
  );

  if (user?.role === 'branch' || user?.role === 'delivery') {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.restrictedContainer}>
          <View style={styles.restrictedIconContainer}>
            <ShoppingCart size={64} color={colors.textMuted} />
          </View>
          <Text style={styles.restrictedTitle}>Acceso Restringido</Text>
          <Text style={styles.restrictedSubtitle}>
            {user.role === 'branch' ? 'Las sucursales' : 'Los repartidores'} no pueden realizar pedidos.
            Solo pueden gestionar los pedidos de los clientes.
          </Text>
          <TouchableOpacity
            style={styles.goToOrdersButton}
            onPress={() => router.push("/orders" as any)}
          >
            <Text style={styles.goToOrdersButtonText}>Ir a Pedidos</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {!anyBranchOpen && (
        <View style={styles.closedBanner}>
          <Text style={styles.closedBannerText}>
            🕐 Todas las sucursales están cerradas - Abrimos {nextOpenTime}
          </Text>
        </View>
      )}
      
      <View style={styles.staticHeaderContainer}>
        <Image 
          source={{ uri: 'https://frychickenhn.com/wp-content/uploads/2025/12/Encabezado.jpg' }}
          style={styles.headerImage}
          resizeMode="cover"
        />
        <TouchableOpacity 
          style={styles.searchButtonOverlay}
          onPress={() => setShowSearch(true)}
        >
          <Search size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={selectedCategory ? [{ category: categories.find(c => c.id === selectedCategory)!, products: filteredProducts }] : groupedProducts}
        renderItem={renderCategorySection}
        keyExtractor={(item) => item.category.id}
        ListHeaderComponent={renderListHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

      <AddToCartSuccessModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
      />

      <Modal visible={showPopup} transparent animationType="fade">
        <View style={styles.popupOverlay}>
          <View style={styles.popupContainer}>
            <TouchableOpacity
              style={styles.popupCloseButton}
              onPress={() => setShowPopup(false)}
            >
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handlePopupPress} activeOpacity={0.9}>
              {marketingPopup?.image && (
                <Image
                  source={{ uri: marketingPopup.image }}
                  style={styles.popupImage}
                />
              )}
            </TouchableOpacity>
            <Text style={styles.popupHint}>Toca la imagen para ver el producto</Text>
          </View>
        </View>
      </Modal>

      <Modal visible={showSearch} transparent animationType="fade">
        <View style={styles.searchOverlay}>
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Search size={20} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar productos..."
                placeholderTextColor={colors.textMuted}
                value={searchText}
                onChangeText={setSearchText}
                autoFocus
              />
              <TouchableOpacity
                onPress={() => {
                  setSearchText("");
                  setShowSearch(false);
                }}
              >
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.searchBackdrop} 
            onPress={() => setShowSearch(false)}
            activeOpacity={1}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    staticHeaderContainer: {
      position: "relative",
      width: "100%",
      height: 120,
    },
    headerImage: {
      width: "100%",
      height: "100%",
    },
    searchButtonOverlay: {
      position: "absolute",
      top: 12,
      right: 16,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "transparent",
      alignItems: "center",
      justifyContent: "center",
    },
    categoriesSection: {
      marginBottom: 16,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: "700" as const,
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    categoriesList: {
      paddingHorizontal: 16,
    },
    listContent: {
      paddingBottom: 20,
    },
    categorySection: {
      marginBottom: 24,
    },
    categoryTitle: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: "700" as const,
      paddingHorizontal: 16,
      marginBottom: 12,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    productsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      paddingHorizontal: 12,
    },
    productWrapper: {
      width: "100%",
      paddingHorizontal: 4,
      marginBottom: 12,
    },
    closedBanner: {
      backgroundColor: colors.accent,
      paddingVertical: 10,
      paddingHorizontal: 16,
      alignItems: "center",
    },
    closedBannerText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "600" as const,
    },
    cartNotification: {
      position: "absolute",
      bottom: 20,
      left: 16,
      right: 16,
      backgroundColor: colors.success,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    cartNotificationText: {
      flex: 1,
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "600" as const,
    },
    popupOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    popupContainer: {
      width: "100%",
      maxWidth: 400,
      position: "relative",
    },
    popupCloseButton: {
      position: "absolute",
      top: -40,
      right: 0,
      zIndex: 10,
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      borderRadius: 20,
      padding: 8,
    },
    popupImage: {
      width: "100%",
      height: 220,
      borderRadius: 16,
    },
    popupHint: {
      color: "rgba(255, 255, 255, 0.7)",
      fontSize: 12,
      textAlign: "center",
      marginTop: 12,
    },
    restrictedContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 32,
    },
    restrictedIconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
    },
    restrictedTitle: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: "700" as const,
      marginBottom: 8,
      textAlign: "center",
    },
    restrictedSubtitle: {
      color: colors.textSecondary,
      fontSize: 14,
      textAlign: "center",
      marginBottom: 24,
      lineHeight: 20,
    },
    goToOrdersButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 32,
      paddingVertical: 14,
      borderRadius: 12,
    },
    goToOrdersButtonText: {
      color: colors.secondary,
      fontSize: 16,
      fontWeight: "700" as const,
    },
    searchOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    searchContainer: {
      backgroundColor: colors.background,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    searchInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
    },
    searchInput: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: 16,
      padding: 0,
    },
    searchBackdrop: {
      flex: 1,
    },
  });