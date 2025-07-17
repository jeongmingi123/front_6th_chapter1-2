// 이벤트 핸들러 저장소 (element → Map(eventType → Set(handler)))
const eventStore = new Map();

// 현재 root 요소 저장
let currentRoot = null;

// 이벤트 핸들러를 저장하는 함수
export function addEvent(element, eventType, handler) {
  if (!eventStore.has(element)) {
    eventStore.set(element, new Map());
  }

  const typeMap = eventStore.get(element);
  if (!typeMap.has(eventType)) {
    typeMap.set(eventType, new Set());
  }

  const handlerSet = typeMap.get(eventType);
  handlerSet.add(handler);

  // root가 설정되어 있으면 자동으로 이벤트 위임 업데이트
  if (currentRoot) {
    setupEventListeners(currentRoot);
  }
}

// 이벤트 핸들러를 제거하는 함수
export function removeEvent(element, eventType, handler) {
  if (eventStore.has(element)) {
    const typeMap = eventStore.get(element);
    if (typeMap.has(eventType)) {
      const handlerSet = typeMap.get(eventType);
      handlerSet.delete(handler);

      if (handlerSet.size === 0) {
        typeMap.delete(eventType);
      }
    }
    if (typeMap.size === 0) {
      eventStore.delete(element);
    }
  }

  // root가 설정되어 있으면 자동으로 이벤트 위임 업데이트
  if (currentRoot) {
    setupEventListeners(currentRoot);
  }
}

// 저장된 모든 이벤트를 root에 위임 방식으로 등록하는 함수
export function setupEventListeners(root) {
  currentRoot = root;

  // 이미 등록된 이벤트 리스너 제거
  const existingListeners = root._eventListeners || new Map();
  existingListeners.forEach((handler, eventType) => {
    root.removeEventListener(eventType, handler);
  });

  // 새로운 이벤트 리스너 등록
  const newListeners = new Map();

  // 모든 이벤트 타입을 수집
  const allEventTypes = new Set();
  eventStore.forEach((typeMap) => {
    typeMap.forEach((handlerSet, eventType) => {
      allEventTypes.add(eventType);
    });
  });

  // 각 이벤트 타입에 대해 위임 핸들러 생성
  allEventTypes.forEach((eventType) => {
    const delegatedHandler = (event) => {
      // 이벤트가 발생한 요소부터 시작해서 상위로 올라가면서 핸들러 찾기
      let currentElement = event.target;

      while (currentElement && currentElement !== root) {
        if (eventStore.has(currentElement)) {
          const typeMap = eventStore.get(currentElement);
          if (typeMap.has(eventType)) {
            const handlerSet = typeMap.get(eventType);
            handlerSet.forEach((handler) => {
              handler(event);
            });
          }
        }
        currentElement = currentElement.parentElement;
      }
    };

    root.addEventListener(eventType, delegatedHandler);
    newListeners.set(eventType, delegatedHandler);
  });

  // 새로운 리스너 저장
  root._eventListeners = newListeners;
}

// 저장된 이벤트 정보를 확인하는 유틸리티 함수
export function getEventInfo() {
  const info = {};
  eventStore.forEach((typeMap, element) => {
    const elementInfo = {};
    typeMap.forEach((handlerSet, eventType) => {
      elementInfo[eventType] = handlerSet.size;
    });
    info[element.tagName || "unknown"] = elementInfo;
  });
  return info;
}
