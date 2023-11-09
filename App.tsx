import React, { useLayoutEffect, useState } from "react";
import { Dimensions, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import Item from "./src/Item";
import { Offset, useLayout } from "./src/Layout";

const words = [
  { id: 1, text: "Thiên" },
  { id: 2, text: "địa, địa, địa" },
  { id: 3, text: "bất" },
  { id: 4, text: "nhân, nhân, nhân" },
  { id: 5, text: "dĩ" },
  { id: 6, text: "vạn" },
  { id: 7, text: "vật" },
  { id: 8, text: "vi" },
  { id: 9, text: "sô" },
  { id: 10, text: "cẩu" },
  { id: 11, text: "Thiên, Thiên, Thiên, Thiên" },
  { id: 12, text: "địa" },
  { id: 13, text: "bất" },
  { id: 14, text: "nhân" },
  { id: 15, text: "dĩ" },
  { id: 16, text: "vạn" },
  { id: 17, text: "vật" },
  { id: 18, text: "vi" },
  { id: 19, text: "sô" },
  { id: 20, text: "cẩu" },
  { id: 21, text: "Thiên, Thiên, Thiên, Thiên" },
  { id: 22, text: "địa" },
  { id: 23, text: "bất" },
  { id: 24, text: "nhân" },
  { id: 25, text: "dĩ" },
  { id: 26, text: "vạn" },
  { id: 27, text: "vật" },
  { id: 28, text: "vi" },
  { id: 29, text: "sô" },
  { id: 30, text: "cẩu" },
];

export const itemPerRow = 3;
export const rowPerPage = 4;
export const itemPerPage = itemPerRow * rowPerPage;
export const marginLeft = 16;
export const marginTop = 4;

const pages = Array.from(Array(Math.ceil(words.length / itemPerPage)).keys());

const { width, height } = Dimensions.get("window");
const containerWidth = width * 0.75;
const INNER_MARGIN = 10;

function App(): JSX.Element {
  const scrollRef: any = React.useRef(null);

  const ready = useSharedValue(true);
  const translateX = useSharedValue(0);

  // giá trị original để đánh dấu, sẽ chỉ cập nhật sau khi quá trình thả
  const offsets: Offset[] = words.map((item, index) => ({
    originalOrder: useSharedValue(0),
    order: useSharedValue(index), // thứ tự trong list
    originalPage: useSharedValue(Math.floor(index / itemPerPage)),
    page: useSharedValue(Math.floor(index / itemPerPage)),
    width: useSharedValue(0),
    height: useSharedValue(0),
    rowHeight: useSharedValue(0),
    x: useSharedValue(0), // toạ độ phía trên cùng bên trái
    y: useSharedValue(0), // toạ độ phía trên cùng bên trái
    originalX: useSharedValue(0),
    originalY: useSharedValue(0),
  }));

  const [loading, setLoading] = useState(true);

  const { calPosition } = useLayout({
    itemPerRow,
    rowPerPage,
    marginLeft,
    marginTop,
    pageWidth: containerWidth,
  });

  useLayoutEffect(() => {
    if (!loading) {
      calPosition(offsets);
    }
  }, [loading]);

  const scrollHandler = useAnimatedScrollHandler(
    {
      onScroll: (event) => {
        translateX.value = event.contentOffset.x;
      },
      onBeginDrag: () => {},
      onEndDrag: () => {},
    },
    [],
  );

  return (
    <SafeAreaView
      style={[
        {
          justifyContent: "center",
          alignItems: "center",
          flex: 1,
        },
      ]}
    >
      <GestureHandlerRootView style={styles.container}>
        <View style={[styles.panContainer]} onLayout={() => setLoading(false)}>
          <Animated.ScrollView
            ref={scrollRef}
            onScroll={scrollHandler}
            pagingEnabled
            scrollEventThrottle={16}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {pages.map((image, imageIndex) => {
              const from = itemPerPage * imageIndex;
              const to = from + itemPerPage;

              return (
                <View style={{ width: containerWidth }} key={imageIndex}>
                  <View style={styles.card}>
                    <View style={[styles.innerPanContainer]}>
                      {words.slice(from, to).map((item, index) => (
                        <View
                          style={[styles.itemWrap, { opacity: 0.2 }]}
                          onLayout={({ nativeEvent: { layout } }) => {
                            const offset = offsets[from + index];
                            offset.width.value = layout.width + 5;
                            offset.height.value = layout.height + 5;
                          }}
                          key={`${item.id}_${from + index}`}
                        >
                          <Text style={styles.itemText}>{item.text}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              );
            })}
            <View style={{ position: "absolute", flex: 1 }}>
              {words.map((item, index) => (
                <Item
                  item={item}
                  offsets={offsets}
                  ready={ready}
                  index={index}
                  key={item.id}
                  scrollRef={scrollRef}
                  translateX={translateX}
                />
              ))}
            </View>
          </Animated.ScrollView>
          <View style={styles.indicatorContainer}>
            {pages.map((image, imageIndex) => {
              return (
                <Dot
                  key={`${image}_${imageIndex}`}
                  translateX={translateX}
                  inputRange={[
                    containerWidth * (imageIndex - 1),
                    containerWidth * imageIndex,
                    containerWidth * (imageIndex + 1),
                  ]}
                />
              );
            })}
          </View>
        </View>
      </GestureHandlerRootView>
    </SafeAreaView>
  );
}

const Dot = (props: any) => {
  const { translateX, inputRange } = props;

  const style = useAnimatedStyle(() => {
    return {
      width: interpolate(
        translateX.value,
        inputRange,
        [8, 16, 8],
        Extrapolate.CLAMP,
      ),
      transform: [
        {
          scale: interpolate(
            translateX.value,
            inputRange,
            [1, 1.2, 1],
            Extrapolate.CLAMP,
          ),
        },
      ],
    };
  });

  return <Animated.View style={[styles.normalDot, style]} />;
};

export const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "600",
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "400",
  },
  highlight: {
    fontWeight: "700",
  },
  container: {
    flex: 1,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  itemWrap: {
    backgroundColor: "red",
    padding: 5,
    width: containerWidth / 4 - INNER_MARGIN,
    borderWidth: 1,
  },
  itemText: {
    textAlign: "center",
    color: "white",
  },
  modalContainer: {
    position: "absolute",
    width,
    height,
    left: 0,
    top: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackdrop: {
    position: "absolute",
    width,
    height,
    // backgroundColor: "#000",
    // opacity: 0.3,
  },
  panContainer: {
    width: containerWidth,
    height: 300,
    backgroundColor: "white",
  },
  innerPanContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    alignItems: "flex-start",
  },
  card: {
    flex: 1,
    marginVertical: marginTop,
    marginHorizontal: marginLeft,
    borderRadius: 5,
    overflow: "hidden",
    backgroundColor: "aqua",
  },
  textContainer: {
    backgroundColor: "rgba(0,0,0, 0.7)",
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 5,
  },
  infoText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  indicatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  normalDot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: "silver",
    marginHorizontal: 4,
  },
});

export default App;
