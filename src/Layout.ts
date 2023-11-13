import { between } from "react-native-redash";
import { SharedValue } from "react-native-reanimated";

export type SharedValues<T extends Record<string, string | number | boolean>> =
  {
    [K in keyof T]: SharedValue<T[K]>;
  };

export type Offset = SharedValues<{
  originalOrder: number;
  order: number;
  originalPage: number;
  page: number;
  width: number;
  height: number;
  rowHeight: number;
  x: number;
  y: number;
  originalX: number;
  originalY: number;
}>;

export const useLayout = (props: {
  itemPerRow: number;
  rowPerPage: number;
  marginTop: number;
  marginLeft: number;
  pageWidth: number;
}) => {
  const { itemPerRow, rowPerPage, marginTop, marginLeft, pageWidth } = props;
  const itemPerPage = itemPerRow * rowPerPage;

  /** tính index tương đối của phần tử đang thao tác */
  const calIndex = (offset: any, offsets: Array<any>) => {
    "worklet";

    const oldPage = Math.floor(offset.order.value / itemPerPage);
    const newPage = offset.page.value;

    if (oldPage > newPage) {
      return itemPerPage * oldPage - 1;
    }
    if (oldPage < newPage) {
      return itemPerPage * newPage;
    }

    // sắp xếp theo order
    const _offsets = [...offsets]
      .sort(
        (first, second) =>
          first.originalOrder.value - second.originalOrder.value,
      )
      .filter((x) => x.originalPage.value == oldPage);

    const x = offset.x.value;
    const y = offset.y.value;
    const width = offset.width.value;
    const height = offset.rowHeight.value;

    // tìm phần tử đầu tiên trong list có thể đảo vị trí
    let _offset = _offsets.find(
      (os) =>
        (between(
          x + width / 4,
          os.originalX.value,
          os.originalX.value + os.width.value,
        ) ||
          between(
            x + (width * 3) / 4,
            os.originalX.value,
            os.originalX.value + os.width.value,
          )) &&
        (between(
          y + height / 4,
          os.originalY.value,
          os.originalY.value + os.height.value,
        ) ||
          between(
            y + (height * 3) / 4,
            os.originalY.value,
            os.originalY.value + os.height.value,
          )),
    );

    // nếu ko có thì tìm phần tử đầu tiên trong hàng có thể đảo vị trí
    // if (!_offset)
    //   _offset = _offsets.find(
    //     (os) =>
    //       x < os.originalX.value &&
    //       between(y, os.originalY.value, os.originalY.value + os.height.value),
    //   );

    if (_offset) return _offset.originalOrder.value;

    // nếu ko có thì xem item đã di chuyển ra đầu trang chưa => index = 0
    if (
      _offsets.length &&
      x < _offsets[0].originalX.value &&
      y < _offsets[0].originalY.value
    )
      return itemPerPage * newPage;

    // ko hợp lệ xếp về cuối
    return itemPerPage * newPage + _offsets.length - 1;
  };

  /**Tính + set vị trí {x, y} của tất cả phần tử
   * Nếu có ignoreIndex tức là đang trong quá trình kéo, sẽ bỏ qua phần tử đang kéo và ko set giá trị original
   */
  const calPosition = (offsets: Array<any>, ignoreIndex?: number) => {
    "worklet";
    for (let gIndex = 0; gIndex < offsets.length / itemPerRow; gIndex++) {
      // tính vị trí bắt đầu theo trục Y của dòng, trục X bắt đầu luôn là 0
      let yValue = marginTop;
      if (gIndex > 0) {
        const rIndex = gIndex % rowPerPage; // row index trên trang
        // xét trên trang của dòng
        for (let i = gIndex - rIndex; i < gIndex; i++) {
          const first = offsets[i * itemPerRow]; // phần tử đầu tiên của dòng
          // set giá trị height của dòng bằng nhau, theo phần tử cao nhất
          let maxHeight = first.height.value;
          for (let j = 1; j < itemPerRow; j++) {
            if (offsets[i * itemPerRow + j])
              maxHeight = Math.max(
                maxHeight,
                offsets[i * itemPerRow + j].height.value,
              );
          }
          yValue += maxHeight;
        }
      }

      const first = offsets[gIndex * itemPerRow]; // phần tử đầu tiên của dòng
      // set giá trị height của dòng bằng nhau, theo phần tử cao nhất
      let maxHeight = first.height.value;
      for (let j = 1; j < itemPerRow; j++) {
        if (offsets[gIndex * itemPerRow + j])
          maxHeight = Math.max(
            maxHeight,
            offsets[gIndex * itemPerRow + j].height.value,
          );
      }

      // set giá trị từng phần tử
      for (let i = 0; i < itemPerRow; i++) {
        if (offsets[gIndex * itemPerRow + i]) {
          const item = offsets[gIndex * itemPerRow + i];
          // tránh phần tử đang chọn ra
          if (item.originalOrder.value == ignoreIndex) {
            continue;
          }
          item.rowHeight.value = maxHeight;
          item.x.value =
            pageWidth * item.page.value + marginLeft + item.width.value * i;
          item.y.value = yValue;
          // Nếu có ignoreIndex tức là đang trong quá trình kéo, sẽ bỏ qua phần tử đang kéo và ko set giá trị original
          if (ignoreIndex !== undefined) {
            continue;
          }
          item.originalY.value = yValue;
          item.originalX.value = item.x.value;
          item.originalOrder.value = item.order.value;
        }
      }
    }
  };

  /** di chuyển các phần tử khác */
  const move = (oldIndex: number, newIndex: number, offsets: Array<any>) => {
    "worklet";

    const selecting = offsets.find((x) => x.originalOrder.value === oldIndex);
    // cập nhật order hiện tại
    selecting.order.value = newIndex;

    offsets.forEach((item) => {
      let order = item.originalOrder.value;
      // cập nhật order và toạ độ các điểm khác
      if (order != oldIndex) {
        // những phần tử nằm giữa newIndex và oldIndex là bị thay đổi order
        if (
          (order <= newIndex && order > oldIndex && newIndex > oldIndex) ||
          (order >= newIndex && order < oldIndex && newIndex < oldIndex)
        ) {
          if (order < oldIndex) {
            order += 1;
          } else {
            order -= 1;
          }
        }
        item.order.value = order;
      }
    });

    const _offsets = [...offsets].sort(
      (first, second) => first.order.value - second.order.value,
    );

    calPosition(_offsets, oldIndex);
  };

  /** cập nhật giá trị original tất cả */
  const setPosition = (offset: any, offsets: Array<any>) => {
    "worklet";
    const oldIndex = offset.originalOrder.value;
    const newIndex = offset.order.value;

    // cập nhật original cho các phần tử khác
    offsets.forEach((item: any) => {
      let originalOrder = item.originalOrder.value;
      if (originalOrder != oldIndex) {
        if (
          (originalOrder <= newIndex &&
            originalOrder > oldIndex &&
            newIndex > oldIndex) ||
          (originalOrder >= newIndex &&
            originalOrder < oldIndex &&
            newIndex < oldIndex)
        ) {
          if (originalOrder < oldIndex) {
            originalOrder += 1;
          } else {
            originalOrder -= 1;
          }
        }
        item.order.value = originalOrder;
        item.originalOrder.value = originalOrder;
        const page = Math.floor(originalOrder / itemPerPage);
        item.originalPage.value = page;
        item.page.value = page;
      }
    });

    offset.originalPage.value = offset.page.value;
    offset.originalOrder.value = newIndex;
    const _offsets = [...offsets].sort(
      (first, second) => first.originalOrder.value - second.originalOrder.value,
    );
    calPosition(_offsets);
  };

  return { calIndex, calPosition, move, setPosition };
};
