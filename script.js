"use strict";

(() => {
  const STORAGE_KEY = "focusforge.data.v1";
  const TIMER_KEY = "focusforge.timer.v1";
  const CALENDAR_STORAGE_KEY = "focusforge.calendar.v1";
  const CLOUD_OWNER_KEY = "focusforge.cloud-owner.v1";
  const THEME_STORAGE_KEY = "focusforge.theme.v1";
  const SOUND_STORAGE_KEY = "focusforge.sound.v1";
  const DEFAULT_SOUND_SETTINGS = { enabled: true, type: "bell", volume: 70 };
  const SOUND_TYPES = ["bell", "chime", "digital", "gentle"];
  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyAMOy4RdnOTYVDfMIWUntTmNcZ8oYiEuxM",
    authDomain: "focusforge-dce04.firebaseapp.com",
    projectId: "focusforge-dce04",
    storageBucket: "focusforge-dce04.firebasestorage.app",
    messagingSenderId: "1003664061267",
    appId: "1:1003664061267:web:0d5a6d977223f3e605e7a6",
    measurementId: "G-8SFVL3Z0GE"
  };
  const FIREBASE_SDK_VERSION = "10.8.0";
  // Local music files are kept together in music/.
  const LOCAL_TRACKS = [
    { id: "local-chill-01", title: "Quiet Afternoon", artist: "Nhạc cục bộ · MP3/OGG/WAV", category: "chill", src: "music/quiet-afternoon.mp3" },
    { id: "local-coffee-01", title: "Coffee Break", artist: "Nhạc cục bộ · MP3/OGG/WAV", category: "coffee", src: "music/coffee-break.mp3" },
    { id: "local-sleep-01", title: "Soft Night", artist: "Nhạc cục bộ · MP3/OGG/WAV", category: "sleep", src: "music/soft-night.mp3" },
    { id: "local-study-01", title: "Deep Work", artist: "Nhạc cục bộ · MP3/OGG/WAV", category: "study", src: "music/deep-work.mp3" },
    { id: "local-rain", title: "Tiếng mưa thư giãn", artist: "Âm thanh thư giãn · MP3/OGG/WAV", category: "sleep", src: "music/rain.mp3" }
  ];
  const MIN_FOCUS_MINUTES = 15;
  const VENT_MESSAGES = [
    "Your mind is clear. Let's focus on what truly matters.",
    "You don't have to solve everything right now. Just take the next small step.",
    "Take one slow breath. You can begin again from here.",
    "One focused minute is a meaningful start.",
    "You've made space to listen to yourself. Now choose what matters most."
  ];
  const PRESET_THEMES = [
    { id: "pine-mist", name: "Pine & Mist", description: "Pine green · mist", icon: "✦", colors: { bg: "#101915", surface: "#17221d", raised: "#1d2c25", line: "#304137", lineSoft: "#27352c", text: "#edf2ec", muted: "#a0afa4", accent: "#9dbd92", secondary: "#668879", green: "#a4d4ae" } },
    { id: "cyberpunk-observatory", name: "Cyberpunk Observatory", description: "Neon blue · aurora violet", icon: "◈", colors: { bg: "#10111e", surface: "#1a1b2c", raised: "#22243a", line: "#383750", lineSoft: "#2b2c42", text: "#f0efff", muted: "#a5a4bd", accent: "#bb82ff", secondary: "#58d9ef", green: "#76e2c0" } },
    { id: "vintage-library", name: "Vintage Library", description: "Mahogany · amber light", icon: "▤", colors: { bg: "#19140f", surface: "#241c15", raised: "#30241a", line: "#49392b", lineSoft: "#382c21", text: "#f3e9db", muted: "#b9a893", accent: "#dfa65f", secondary: "#9f6748", green: "#a6b77c" } },
    { id: "rainy-solitude", name: "Rainy Solitude", description: "Rain cloud · water blue", icon: "⌁", colors: { bg: "#11171b", surface: "#1a2429", raised: "#222f35", line: "#34454b", lineSoft: "#293940", text: "#e9f0f1", muted: "#9eafb4", accent: "#83c2cf", secondary: "#658ca5", green: "#91c7ac" } },
    { id: "maple-autumn", name: "Maple Autumn", description: "Maple orange · brick red", icon: "✺", colors: { bg: "#1b1413", surface: "#281d1a", raised: "#342420", line: "#4b332c", lineSoft: "#3a2925", text: "#f3e9e4", muted: "#b8a39c", accent: "#ec9562", secondary: "#a84e42", green: "#a8b27c" } }
  ];
  const DEFAULT_THEME_STORE = { selectedId: "pine-mist", customThemes: [] };
  let themeStore = { ...DEFAULT_THEME_STORE, customThemes: [] };
  const HABIT_COLORS = ["#ff8a3d", "#77c69d", "#7da5e8", "#b39bdd", "#df8f9a"];
  const DATA_VERSION = 2;
  const PAGE_NAMES = {
    overview: "Tổng quan",
    tasks: "Tasks",
    focus: "Focus",
    explore: "Explore",
    habits: "Thói quen",
    statistics: "Thống kê",
    achievements: "Thành tích",
    settings: "Cài đặt"
  };
  const DAY_NAMES = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const METHODS = [
    { id: "active-recall", name: "Active Recall", group: "Ghi nhớ", duration: "20–30 phút", recommendedMinutes: 25, summary: "Tự nhớ lại kiến thức thay vì chỉ đọc lại.", principle: "Khi bạn tự cố gắng gọi lại thông tin từ trí nhớ, bạn đang tạo ra các cú chạm để củng cố kiến thức. Phương pháp này thúc đẩy việc tái gọi chủ động, thay vì chỉ nhận biết thông tin khi xem lại tài liệu.", evidence: "Active Recall và Spaced Repetition có bằng chứng mạnh nhất cho ghi nhớ dài hạn trong học tập. Chúng phù hợp cho việc nắm vững khái niệm, công thức và từ vựng, đặc biệt khi được áp dụng đều đặn.", whenUse: "Dùng khi bạn muốn ôn lại kiến thức sau khi học xong một phần mới hoặc trước khi làm bài kiểm tra. Phù hợp với môn Toán, Lý, Hóa, Tin học và từ vựng/IELTS.", avoid: "Không nên dùng như một cách đọc lướt hoặc chỉ nhắc lại bằng miệng mà không kiểm tra đáp án. Nếu bạn chưa có nền tảng cơ bản, việc tự hỏi quá nhiều câu khó có thể khiến bạn mất động lực.", steps: ["Đóng tài liệu và đặt câu hỏi về chủ đề vừa học.", "Trả lời hoặc giải thích bằng trí nhớ trước khi xem lại đáp án.", "Kiểm tra kết quả và ghi lại phần sai hoặc thiếu sót.", "Lặp lại theo chu kỳ ngắn nhiều lần trong ngày và cuối tuần."], example: "Học Toán: giải một bài tập bằng giấy nháp, sau đó xem lại đáp án để tìm chỗ sai. Học IELTS: tự kể lại đoạn hội thoại hoặc nhắc lại từ vựng mà không nhìn tài liệu.", mistakes: ["Chỉ đọc lại đáp án mà không thử nhớ trước.", "Không ghi lại phần sai vì vậy lặp lại lỗi tương tự.", "Quá nhiều câu hỏi khó khiến mất thời gian mà không hiểu sâu."], combine: "Kết hợp tốt nhất với Spaced Repetition để tăng độ bền của trí nhớ và Practice Testing để kiểm tra mức độ nắm chắc thực tế." },
    { id: "spaced-repetition", name: "Spaced Repetition", group: "Ghi nhớ", duration: "15–25 phút", recommendedMinutes: 20, summary: "Ôn tập theo khoảng cách thời gian giúp ghi nhớ bền lâu hơn.", principle: "Nhớ lại ở các thời điểm cách xa dần sẽ giúp bạn vượt qua ngưỡng quên. Thay vì học một lần rồi bỏ quên, bạn ôn lại theo lịch để định hình trí nhớ dài hạn.", evidence: "Đây là một trong những kỹ thuật ghi nhớ có bằng chứng ủng hộ rõ ràng nhất. Kết quả mạnh hơn so với việc ôn liên tục trong cùng một buổi học, nhưng hiệu quả phụ thuộc vào cách thiết kế lịch ôn hợp lý.", whenUse: "Hữu ích khi học từ vựng, công thức, định nghĩa, sự kiện lịch sử hoặc các khái niệm cần ghi nhớ lâu dài.", avoid: "Không cần phải theo một công thức tối ưu cho mọi người. Lịch ôn nên linh hoạt theo mức độ nhớ và khối lượng kiến thức.", steps: ["Lập danh sách chủ đề hoặc flashcard cần nhớ.", "Ôn ngay trong ngày, sau 1–3 ngày, rồi 7 ngày, 14 ngày nếu cần.", "Tăng khoảng cách khi bạn đã nhớ tốt, hạ xuống khi bạn quên.", "Kết hợp với Active Recall để kiểm tra lại thay vì chỉ nhìn lại flashcard."], example: "Một lịch ôn gợi ý: ngày 1 học từ mới, ngày 3 ôn lại, ngày 7 ôn lại, ngày 14 ôn lại. Đây là mẫu khởi đầu, không phải công thức tuyệt đối.", mistakes: ["Ôn lại quá nhiều trong cùng một ngày mà không chia thời gian.", "Chỉ xem đáp án mà không thử nhớ trước.", "Không theo dõi mốc thời gian nên quên mất lịch ôn."], combine: "Rất hiệu quả khi kết hợp với flashcards và Active Recall, đặc biệt trong luyện từ vựng và các khái niệm thuộc cần nhớ lâu." },
    { id: "pomodoro", name: "Pomodoro", group: "Quản lý thời gian", duration: "25 phút + nghỉ 5 phút", recommendedMinutes: 25, summary: "Chia thời gian học thành chu kỳ tập trung và nghỉ ngắn giúp duy trì nhịp làm việc.", principle: "Pomodoro không phải kiểu học hiệu quả hơn mọi phương pháp; nó chủ yếu là công cụ quản lý thời gian để giảm cảm giác quá tải và giúp bạn bắt đầu từng phiên tập trung.", evidence: "Công cụ này hỗ trợ người học duy trì nhịp làm việc dài hơn mà ít cảm giác mệt mỏi, nhưng bằng chứng về hiệu suất học tập không đồng đều giữa người với người.", whenUse: "Khi bạn dễ mất tập trung, khó bắt đầu, hoặc cần chia công việc lớn thành các phiên thực hiện nhỏ hơn.", avoid: "Không nên ép phải giữ nguyên 25 phút nếu bạn đang ở trạng thái rất mệt hoặc cần duy trì luồng ý tưởng liên tục. Pomodoro nên được tùy chỉnh theo mục tiêu và cảm giác của bạn.", steps: ["Chọn một nhiệm vụ cụ thể và tạo một phiên tập trung cố định.", "Làm việc trong khoảng thời gian bạn đã đặt, ưu tiên không mở tab khác hoặc kiểm tra tin nhắn.", "Nghỉ 3–5 phút sau mỗi phiên, rồi tiếp tục chu kỳ mới.", "Sau 3–4 phiên cẩn thận, nghỉ dài hơn nếu cần."], example: "Một buổi ôn Toán có thể là 25 phút giải bài, 5 phút nghỉ, rồi tiếp tục 25 phút đọc lý thuyết. Bạn hoàn toàn có thể dùng 20 phút / 5 phút hoặc 30 phút / 10 phút nếu phù hợp.", mistakes: ["Không đặt mục tiêu rõ ràng mỗi phiên.", "Nghỉ quá dài khiến mất nhịp làm việc.", "Dùng Pomodoro như một yếu tố bắt buộc thay vì tùy biến theo độ tập trung."], combine: "Pomodoro phù hợp làm nền tảng cho Active Recall, Feynman hoặc Practice Testing, vì tạo nhịp làm việc rõ ràng và giảm cảm giác ngập đầu." },
    { id: "interleaving", name: "Interleaving", group: "Luyện tập", duration: "25–40 phút", recommendedMinutes: 30, summary: "Xen kẽ các dạng bài hoặc chủ đề có liên quan để phát triển khả năng ứng dụng linh hoạt.", principle: "Thay vì chỉ làm đi làm lại cùng một kiểu bài, bạn xen kẽ các dạng bài, mạch kiến thức hoặc dạng câu hỏi liên quan. Điều này giúp bạn phân biệt kiểu nhiệm vụ và tái sử dụng kiến thức ở nhiều bối cảnh khác nhau.", evidence: "Interleaving là kỹ thuật rất hữu ích khi bạn đã có nền tảng cơ bản và cần làm quen với sự đa dạng của kiểu bài. Nó khác với việc đổi nhiệm vụ liên tục không có mục đích.", whenUse: "Phù hợp khi bạn đã học xong một số chủ đề rồi và muốn rèn luyện khả năng nhận diện dạng bài trong các tình huống khác nhau.", avoid: "Không nên dùng khi bạn còn đang mơ hồ về kiến thức nền tảng. Nếu bạn chưa hiểu cơ bản, việc xen kẽ quá nhiều dạng bài có thể khiến bạn lạc hướng.", steps: ["Nhóm các dạng bài hoặc chủ đề có liên quan nhau.", "Làm một dạng bài trong thời gian ngắn, rồi chuyển sang dạng khác.", "Sau khi hoàn thành, so sánh điểm giống và khác giữa các dạng bài.", "Tập trung vào việc tìm dạng bài liên quan chứ không phải nhảy qua nhiều nhiệm vụ không có kết nối."], example: "Với Toán, bạn có thể xen kẽ bài phương trình, hệ phương trình và bài toán thực tế trong cùng một buổi luyện. Với lập trình, có thể xen kẽ viết thuật toán, đọc code và sửa lỗi nhỏ.", mistakes: ["Đổi môn quá nhiều mà không có mục đích rõ ràng.", "Xen kẽ quá nhiều nhiệm vụ khiến không đủ thời gian cho dạng bài nào.", "Không tổng kết sau mỗi phần để nắm điểm giống và khác."], combine: "Interleaving hiệu quả khi kết hợp với Practice Testing, vì bạn vừa giải bài vừa xác định kiểu câu hỏi mà mình còn yếu." },
    { id: "feynman-technique", name: "Feynman Technique", group: "Hiểu sâu", duration: "20–30 phút", recommendedMinutes: 25, summary: "Giải thích bằng ngôn ngữ đơn giản để phát hiện lỗ hổng trong hiểu biết.", principle: "Nếu bạn muốn thật sự hiểu, hãy thử giải thích một khái niệm theo cách dễ hiểu với người không chuyên. Khi bạn không thể diễn giải rõ ràng, đó là dấu hiệu rằng bạn chưa nắm chắc kiến thức đó.", evidence: "Kỹ thuật này rất hiệu quả để kiểm tra sự hiểu biết sâu, nhưng nó không phải loại bằng chứng thống kê mạnh như Active Recall; nó tập trung vào sự chính xác trong cách giải thích và tự kiểm tra.", whenUse: "Hữu ích khi bạn đã học xong một khái niệm nhưng chưa chắc chắn mình có hiểu đúng hay không.", avoid: "Giải thích trôi chảy không đồng nghĩa với hiểu thực sự. Bạn vẫn cần xác minh từng bước và sửa sai nếu có.", steps: ["Chọn một khái niệm bạn muốn hiểu sâu.", "Giải thích nó bằng lời của mình với ngôn ngữ đơn giản, như đang dạy một người mới bắt đầu.", "Xác định chỗ bạn mắc lỡ hoặc dùng từ ngữ mơ hồ.", "Tìm lại nguồn kiến thức để sửa lỗ hổng và giải thích lại."], example: "Giải thích khái niệm điện trở trong Lý bằng câu nói đơn giản: 'Điện trở làm chậm dòng điện...'. Nếu bạn không thể giải thích rõ, hãy quay lại định nghĩa và ví dụ thực tế.", mistakes: ["Đọc lại bản ghi chú thay vì tự giải thích.", "Giả vờ hiểu vì đã nghe qua khái niệm.", "Không kiểm tra lại bằng nguồn thật, chỉ dựa vào cảm giác mình đã hiểu."], combine: "Cực kỳ thích hợp sau khi học xong một phần, rồi kết hợp với Active Recall để luyện lại trên giấy hoặc trong phiên Focus." },
    { id: "practice-testing", name: "Practice Testing", group: "Luyện tập", duration: "30–45 phút", recommendedMinutes: 35, summary: "Tự kiểm tra bằng câu hỏi và đề luyện tập để xác định phần còn yếu.", principle: "Tự làm bài kiểm tra giúp bạn nhận ra những phần chưa chắc chắn và liên kết kiến thức trong bộ nhớ. Đây là cách học chủ động và sát với bài thi thực tế hơn là chỉ đọc lại nội dung.", evidence: "Practice Testing có giá trị cao trong việc cải thiện khả năng recall, transfer, và kết nối thông tin. Nó rất hợp với các môn có tính chất bài tập, giải thích hoặc nhiều kiến thức cần áp dụng.", whenUse: "Dùng khi bạn sắp kiểm tra, làm đề cương hoặc muốn đánh giá xem mình nắm chắc ở mức nào.", avoid: "Không nên nhầm lẫn với việc làm bài chỉ để lấy điểm mà không phân tích lỗi. ", steps: ["Tạo câu hỏi hoặc đề tương tự với nội dung đã học.", "Làm bài trong điều kiện như thực tế, không nhìn đáp án.", "So sánh với đáp án và ghi lại lỗi của mình.", "Ôn lại phần yếu, rồi làm thêm một vòng khác để xem tiến bộ."], example: "Học Văn: làm bài luận ngắn trong 20 phút, sau đó đối chiếu với gợi ý và chỉnh sửa. Học Tin: làm đề tổng hợp không xem code gốc trước khi xem hướng dẫn.", mistakes: ["Làm bài mà không xem lại lỗi.", "Chỉ làm đề quá dễ, không có độ khó tương ứng.", "Sử dụng bài kiểm tra để tự chốt điểm thay vì để học."], combine: "Practice Testing kết hợp rất tốt với Active Recall và Spaced Repetition: bạn nhớ, bạn kiểm tra và bạn ôn lại ở khoảng cách hợp lý." }
  ];
  const ACHIEVEMENTS = [
    { id: "first-focus", title: "Bước đầu tiên", description: "Hoàn thành phiên Focus hợp lệ đầu tiên.", icon: "01", test: (data) => data.focusSessions.some((item) => item.valid) },
    { id: "three-day-streak", title: "Giữ nhịp 3 ngày", description: "Đạt mục tiêu Focus trong 3 ngày liên tiếp.", icon: "03", test: (data) => streakStats(data).best >= 3 },
    { id: "seven-day-streak", title: "Một tuần bền bỉ", description: "Đạt mục tiêu Focus trong 7 ngày liên tiếp.", icon: "07", test: (data) => streakStats(data).best >= 7 },
    { id: "focus-master", title: "Mười giờ tập trung", description: "Tích lũy 10 giờ Focus hợp lệ.", icon: "10", test: (data) => validFocusMs(data) >= 600 * 60000 },
    { id: "habit-builder", title: "Người xây thói quen", description: "Hoàn thành thói quen trong 7 ngày khác nhau.", icon: "H", test: (data) => new Set(data.xpEvents.filter((event) => event.type === "habit").map((event) => event.date)).size >= 7 }
  ];
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));
  const state = {
    data: null,
    timer: null,
    toastTimeout: 0,
    tickHandle: 0,
    editingHabitId: null,
    confirmAction: null,
    storageReadFailed: false,
    observedDate: "",
    clockWarningShown: false,
    clockSample: null,
    activePage: null,
    navigationTimeout: 0,
    navigationFrame: 0,
    calendarDate: "",
    selectedCalendarDate: "",
    calendarSchedules: [],
    calendarReadFailed: false,
    editingSchedule: null,
    activityYear: new Date().getFullYear(),
    activitySelectedDate: localDate(),
    firebase: null,
    firebaseInitPromise: null,
    firebaseError: "",
    user: null,
    authBusy: false,
    cloudLoading: false,
    cloudError: "",
    authGeneration: 0,
    authUnsubscribe: null,
    cloudUnsubscribe: null,
    cloudReady: false,
    cloudSaveTimeout: 0,
    cloudContentSignature: "",
    cloudSessionIds: new Set(),
    cloudProfileSnapshot: null,
    cloudSessionSnapshot: null
  };
  let soundSettings = { ...DEFAULT_SOUND_SETTINGS };
  let soundStorageReadFailed = false;
  let audioContext = null;
  let timerAlarmSources = [];
  let previewAlarmSources = [];
  let timerAlarmScheduled = false;
  let timerAlarmStartTime = 0;
  let timerAlarmEndTime = 0;
  let lastAudioError = "";

  function localDate(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function shiftDate(dateKey, offset) {
    const [year, month, day] = dateKey.split("-").map(Number);
    const date = new Date(year, month - 1, day + offset, 12);
    return localDate(date);
  }

  function dateFromKey(dateKey) {
    const [year, month, day] = dateKey.split("-").map(Number);
    return new Date(year, month - 1, day, 12);
  }

  function newId() {
    return window.crypto && typeof window.crypto.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }

  function createDefaultData() {
    const today = localDate();
    return {
      version: DATA_VERSION,
      createdAt: new Date().toISOString(),
      dateCheckpoint: { date: today, observedAt: new Date().toISOString() },
      settings: { dailyGoalMinutes: 60, defaultDurationMinutes: 25 },
      dailyTargets: { [today]: 60 },
      focusSessions: [],
      tasks: [],
      habits: [],
      habitArchive: [],
      xpEvents: [],
      achievements: [],
      selectedMethodId: "pomodoro"
    };
  }

  function showToast(message, error = false) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.toggle("error", error);
    toast.classList.add("show");
    window.clearTimeout(state.toastTimeout);
    state.toastTimeout = window.setTimeout(() => toast.classList.remove("show"), 4000);
  }

  function validSoundSettings(value) {
    return isPlainObject(value) && typeof value.enabled === "boolean"
      && SOUND_TYPES.includes(value.type) && Number.isInteger(value.volume)
      && value.volume >= 0 && value.volume <= 100;
  }

  function loadSoundSettings() {
    try {
      const raw = localStorage.getItem(SOUND_STORAGE_KEY);
      if (raw === null) return;
      const stored = JSON.parse(raw);
      if (!validSoundSettings(stored)) throw new Error("Cấu hình âm báo không hợp lệ.");
      soundSettings = stored;
    } catch (error) {
      soundStorageReadFailed = true;
      showToast(`Không thể đọc tùy chọn âm báo; dữ liệu cũ được giữ nguyên. ${error instanceof Error ? error.message : String(error)}`, true);
    }
  }

  function saveSoundSettings() {
    if (soundStorageReadFailed) {
      showToast("Không thể lưu vì tùy chọn âm báo cũ không đọc được; dữ liệu cũ được giữ nguyên.", true);
      return false;
    }
    try {
      localStorage.setItem(SOUND_STORAGE_KEY, JSON.stringify(soundSettings));
      return true;
    } catch (error) {
      showToast(`Không thể lưu tùy chọn âm báo: ${error instanceof Error ? error.message : String(error)}`, true);
      return false;
    }
  }

  function renderSoundSettings() {
    $("#sound-enabled").checked = soundSettings.enabled;
    $("#sound-type").value = soundSettings.type;
    $("#sound-volume").value = String(soundSettings.volume);
    $("#sound-volume-value").value = `${soundSettings.volume}%`;
    $("#sound-volume-value").textContent = `${soundSettings.volume}%`;
  }

  async function prepareAudioContext() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) throw new Error("Trình duyệt này không hỗ trợ Web Audio API.");
      if (!audioContext || audioContext.state === "closed") audioContext = new AudioContextClass();
      if (audioContext.state === "suspended") await audioContext.resume();
      if (audioContext.state !== "running") throw new Error("Trình duyệt chưa cho phép phát âm thanh. Hãy tương tác với trang rồi thử lại.");
      lastAudioError = "";
      return audioContext;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message !== lastAudioError) showToast(`Không thể khởi tạo âm báo: ${message}`, true);
      lastAudioError = message;
      return null;
    }
  }

  function stopAudioSources(sources) {
    if (!audioContext) {
      sources.length = 0;
      return;
    }
    const now = audioContext.currentTime;
    sources.splice(0).forEach((source) => {
      try {
        source.stop(now);
        source.disconnect();
      } catch (error) {
        if (error.name !== "InvalidStateError") {
          showToast(`Không thể dừng âm báo: ${error instanceof Error ? error.message : String(error)}`, true);
        }
      }
    });
  }

  function stopTimerAlarm() {
    timerAlarmScheduled = false;
    timerAlarmStartTime = 0;
    timerAlarmEndTime = 0;
    stopAudioSources(timerAlarmSources);
    const silenceButton = $("#confirm-silence");
    if (silenceButton) silenceButton.hidden = true;
  }

  function stopPreviewAlarm() {
    stopAudioSources(previewAlarmSources);
  }

  function stopAllAlarms() {
    stopTimerAlarm();
    stopPreviewAlarm();
  }

  function stopConfirmationAlarm() {
    stopPreviewAlarm();
    const alarmHasStarted = timerAlarmScheduled && audioContext
      && audioContext.currentTime >= timerAlarmStartTime;
    if (!state.timer || state.timer.status !== "running" || alarmHasStarted) stopTimerAlarm();
  }

  function scheduleAlarmSequence(type, volume, startAt, sources, durationSeconds = null) {
    if (!audioContext || volume <= 0) return;
    const patterns = {
      bell: { gap: 0.95, tones: [[0, 880, 0.62, "sine", 0.2], [0.035, 1320, 0.48, "sine", 0.12], [0.07, 1760, 0.34, "sine", 0.07]] },
      chime: { gap: 1.12, tones: [[0, 659, 0.38, "sine", 0.16], [0.2, 784, 0.38, "sine", 0.16], [0.4, 988, 0.5, "sine", 0.17]] },
      digital: { gap: 0.86, tones: [[0, 880, 0.15, "square", 0.12], [0.2, 660, 0.15, "square", 0.12], [0.4, 880, 0.15, "square", 0.12]] },
      gentle: { gap: 1.2, tones: [[0, 523, 0.46, "sine", 0.13], [0.26, 659, 0.46, "sine", 0.13], [0.52, 784, 0.58, "sine", 0.14]] }
    };
    const pattern = patterns[type];
    if (!pattern) throw new Error("Kiểu âm báo không được hỗ trợ.");
    const lastToneEnd = Math.max(...pattern.tones.map(([offset, , duration]) => offset + duration + 0.03));
    const repeatCount = durationSeconds === null
      ? 3
      : Math.max(1, Math.floor((durationSeconds - lastToneEnd) / pattern.gap) + 1);
    for (let repeat = 0; repeat < repeatCount; repeat += 1) {
      pattern.tones.forEach(([offset, frequency, duration, wave, amplitude]) => {
        const oscillator = audioContext.createOscillator();
        const envelope = audioContext.createGain();
        const beginsAt = startAt + repeat * pattern.gap + offset;
        const endsAt = beginsAt + duration;
        oscillator.type = wave;
        oscillator.frequency.setValueAtTime(frequency, beginsAt);
        envelope.gain.setValueAtTime(0.0001, beginsAt);
        envelope.gain.linearRampToValueAtTime(Math.max(0.0002, amplitude * volume), beginsAt + 0.018);
        envelope.gain.exponentialRampToValueAtTime(0.0001, endsAt);
        oscillator.connect(envelope);
        envelope.connect(audioContext.destination);
        oscillator.onended = () => {
          oscillator.disconnect();
          envelope.disconnect();
          const index = sources.indexOf(oscillator);
          if (index >= 0) sources.splice(index, 1);
          if (sources === timerAlarmSources && sources.length === 0) {
            timerAlarmScheduled = false;
            timerAlarmStartTime = 0;
            timerAlarmEndTime = 0;
            $("#confirm-silence").hidden = true;
          }
        };
        sources.push(oscillator);
        oscillator.start(beginsAt);
        oscillator.stop(endsAt + 0.03);
      });
    }
  }

  function scheduleTimerAlarm() {
    if (!soundSettings.enabled || !state.timer || state.timer.status !== "running"
      || soundSettings.volume === 0 || timerAlarmScheduled || !audioContext || audioContext.state !== "running") return;
    timerAlarmScheduled = true;
    const beginsAt = audioContext.currentTime + Math.max(0, (state.timer.phaseEndsAt - Date.now()) / 1000);
    timerAlarmStartTime = beginsAt;
    timerAlarmEndTime = beginsAt + 300;
    try {
      scheduleAlarmSequence(soundSettings.type, soundSettings.volume / 100, beginsAt, timerAlarmSources, 300);
    } catch (error) {
      stopTimerAlarm();
      showToast(`Không thể lên lịch âm báo: ${error instanceof Error ? error.message : String(error)}`, true);
    }
  }

  async function playSoundPreview() {
    stopPreviewAlarm();
    const context = await prepareAudioContext();
    if (!context) return;
    try {
      scheduleAlarmSequence(soundSettings.type, soundSettings.volume / 100, context.currentTime + 0.04, previewAlarmSources);
    } catch (error) {
      stopPreviewAlarm();
      showToast(`Không thể phát thử âm báo: ${error instanceof Error ? error.message : String(error)}`, true);
    }
  }

  function updateSoundSettings() {
    const next = {
      enabled: $("#sound-enabled").checked,
      type: $("#sound-type").value,
      volume: Number($("#sound-volume").value)
    };
    if (!validSoundSettings(next)) {
      showToast("Tùy chọn âm báo không hợp lệ.", true);
      renderSoundSettings();
      return;
    }
    soundSettings = next;
    $("#sound-volume-value").value = `${next.volume}%`;
    $("#sound-volume-value").textContent = `${next.volume}%`;
    if (saveSoundSettings()) void refreshTimerAlarm();
  }

  async function refreshTimerAlarm() {
    if (!soundSettings.enabled) {
      stopTimerAlarm();
      return;
    }
    if (state.timer?.status !== "running") return;
    stopTimerAlarm();
    const context = await prepareAudioContext();
    if (context) {
      scheduleTimerAlarm();
    }
  }

  function allThemes() {
    return [...PRESET_THEMES, ...themeStore.customThemes];
  }

  function validTheme(theme) {
    return isPlainObject(theme) && typeof theme.id === "string" && /^custom-[\w-]{1,80}$/.test(theme.id)
      && typeof theme.name === "string" && theme.name.trim().length > 0 && theme.name.length <= 32
      && typeof theme.description === "string" && theme.description.length <= 80 && isPlainObject(theme.colors)
      && ["bg", "surface", "raised", "line", "lineSoft", "text", "muted", "accent", "secondary", "green"]
        .every((key) => typeof theme.colors[key] === "string" && /^#[0-9a-f]{6}$/i.test(theme.colors[key]));
  }

  function applyTheme(theme) {
    const root = document.documentElement;
    const { colors } = theme;
    const vars = {
      "--bg": colors.bg,
      "--surface": colors.surface,
      "--surface-raised": colors.raised,
      "--line": colors.line,
      "--line-soft": colors.lineSoft,
      "--text": colors.text,
      "--muted": colors.muted,
      "--accent": colors.accent,
      "--accent-soft": `${colors.accent}20`,
      "--green": colors.green,
      "--wallpaper-overlay": `radial-gradient(ellipse at 83% 9%, ${colors.accent}25 0, transparent 39%), radial-gradient(ellipse at 9% 77%, ${colors.secondary}18 0, transparent 42%)`
    };
    Object.entries(vars).forEach(([name, value]) => root.style.setProperty(name, value));
    root.dataset.theme = theme.id;
  }

  function loadThemeStore() {
    try {
      const raw = localStorage.getItem(THEME_STORAGE_KEY);
      if (raw === null) return;
      const parsed = JSON.parse(raw);
      if (!isPlainObject(parsed) || typeof parsed.selectedId !== "string" || !Array.isArray(parsed.customThemes)
        || parsed.customThemes.length > 20 || !parsed.customThemes.every(validTheme)
        || new Set(parsed.customThemes.map((theme) => theme.id)).size !== parsed.customThemes.length) {
        throw new Error("Theme preferences are invalid.");
      }
      const available = [...PRESET_THEMES, ...parsed.customThemes];
      if (!available.some((theme) => theme.id === parsed.selectedId)) throw new Error("Selected theme was not found.");
      themeStore = { selectedId: parsed.selectedId, customThemes: parsed.customThemes };
    } catch (error) {
      showToast(`Không thể đọc tùy chọn theme đã lưu; dữ liệu gốc được giữ nguyên. ${error.message}`, true);
    }
  }

  function saveThemeStore() {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(themeStore));
      return true;
    } catch (error) {
      showToast(`Không thể lưu theme trên thiết bị: ${error.message}`, true);
      return false;
    }
  }

  function renderThemes() {
    const list = $("#theme-list");
    if (!list) return;
    list.replaceChildren();
    allThemes().forEach((theme) => {
      const selected = themeStore.selectedId === theme.id;
      const card = document.createElement("button");
      card.type = "button";
      card.className = `theme-card${selected ? " is-selected" : ""}`;
      card.dataset.themeId = theme.id;
      card.setAttribute("aria-pressed", String(selected));
      card.setAttribute("aria-label", `${theme.name}${selected ? ", Selected" : ""}`);
      card.style.setProperty("--theme-accent", theme.colors.accent);
      card.style.setProperty("--theme-secondary", theme.colors.secondary);

      const thumbnail = document.createElement("span");
      thumbnail.className = `theme-thumbnail theme-thumbnail-${theme.id}`;
      thumbnail.setAttribute("aria-hidden", "true");
      const motif = document.createElement("span");
      motif.className = "theme-thumbnail-motif";
      const motifLine = document.createElement("span");
      motifLine.className = "theme-thumbnail-line";
      const motifDot = document.createElement("span");
      motifDot.className = "theme-thumbnail-dot";
      thumbnail.append(motif, motifLine, motifDot);

      const copy = document.createElement("span");
      copy.className = "theme-card-copy";
      const name = document.createElement("strong");
      name.textContent = theme.name;
      const description = document.createElement("small");
      description.textContent = theme.description;
      const palette = document.createElement("span");
      palette.className = "theme-palette";
      ["bg", "surface", "accent", "secondary", "green"].forEach((key) => {
        const dot = document.createElement("i");
        dot.style.backgroundColor = theme.colors[key];
        dot.setAttribute("aria-hidden", "true");
        palette.append(dot);
      });
      copy.append(name, description, palette);

      const selectedLabel = document.createElement("span");
      selectedLabel.className = "theme-selected-label";
      selectedLabel.textContent = "Selected";
      selectedLabel.hidden = !selected;
      card.append(thumbnail, copy, selectedLabel);
      list.append(card);
    });
  }

  function selectTheme(themeId) {
    const theme = allThemes().find((item) => item.id === themeId);
    if (!theme) return;
    const previousId = themeStore.selectedId;
    themeStore.selectedId = theme.id;
    applyTheme(theme);
    if (!saveThemeStore()) {
      themeStore.selectedId = previousId;
      applyTheme(allThemes().find((item) => item.id === previousId) || PRESET_THEMES[0]);
      return;
    }
    renderThemes();
  }

  function createCustomTheme(event) {
    event.preventDefault();
    const form = $("#custom-theme-form");
    if (!form.reportValidity()) return;
    if (themeStore.customThemes.length >= 20) {
      showToast("Đã đạt giới hạn 20 theme tùy chỉnh.", true);
      return;
    }
    const name = $("#custom-theme-name").value.trim();
    const accent = $("#custom-theme-accent").value;
    if (!name || !/^#[0-9a-f]{6}$/i.test(accent)) {
      showToast("Nhập tên theme và màu nhấn hợp lệ.", true);
      return;
    }
    const theme = {
      id: `custom-${newId()}`,
      name,
      description: "Custom palette",
      colors: { bg: "#111214", surface: "#1a1b1e", raised: "#202125", line: "#303136", lineSoft: "#292a2e", text: "#f2f0eb", muted: "#a1a1a8", accent, secondary: "#7f8f75", green: "#77c69d" }
    };
    if (!validTheme(theme)) {
      showToast("Không thể tạo theme với thông tin hiện tại.", true);
      return;
    }
    const previousStore = themeStore;
    themeStore = { selectedId: theme.id, customThemes: [...themeStore.customThemes, theme] };
    applyTheme(theme);
    if (!saveThemeStore()) {
      themeStore = previousStore;
      applyTheme(allThemes().find((item) => item.id === themeStore.selectedId) || PRESET_THEMES[0]);
      return;
    }
    form.reset();
    $("#custom-theme-form").hidden = true;
    $("#create-theme-toggle").setAttribute("aria-expanded", "false");
    renderThemes();
    showToast(`Đã tạo và áp dụng theme “${theme.name}”.`);
  }

  function saveData(options = {}) {
    if (state.storageReadFailed) {
      showToast("Dữ liệu hiện có không đọc được nên FocusForge không ghi đè lên đó. Hãy nhập bản sao hợp lệ hoặc xác nhận xóa dữ liệu trong Cài đặt.", true);
      return false;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
      if (options.syncCloud !== false) queueCloudSync();
      return true;
    } catch (error) {
      showToast(`Không thể lưu dữ liệu trên thiết bị: ${error.message}`, true);
      return false;
    }
  }

  function saveTimer() {
    try {
      if (state.timer) localStorage.setItem(TIMER_KEY, JSON.stringify(state.timer));
      else localStorage.removeItem(TIMER_KEY);
      return true;
    } catch (error) {
      showToast(`Không thể lưu trạng thái Focus: ${error.message}`, true);
      return false;
    }
  }

  function isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function isDateKey(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    return localDate(dateFromKey(value)) === value;
  }

  function migrateData(data) {
    if (!isPlainObject(data) || ![1, DATA_VERSION].includes(data.version)) return { data, migrated: false };
    const migrated = { ...data, version: DATA_VERSION };
    if (data.version === DATA_VERSION) {
      let changed = false;
      if (!Array.isArray(migrated.tasks)) {
        migrated.tasks = [];
        changed = true;
      }
      if (!METHODS.some((method) => method.id === migrated.selectedMethodId)) {
        migrated.selectedMethodId = "pomodoro";
        changed = true;
      }
      return { data: migrated, migrated: changed };
    }
    if (!isPlainObject(migrated.dateCheckpoint)) {
      migrated.dateCheckpoint = { date: localDate(), observedAt: new Date().toISOString() };
    }
    if (!Array.isArray(migrated.tasks)) migrated.tasks = [];
    if (!Array.isArray(migrated.habits)) migrated.habits = [];
    if (!Array.isArray(migrated.habitArchive)) migrated.habitArchive = [];
    if (!Array.isArray(migrated.xpEvents)) migrated.xpEvents = [];
    for (const habit of [...migrated.habits, ...migrated.habitArchive]) {
      habit.color = HABIT_COLORS.includes(habit.color) ? habit.color : HABIT_COLORS[0];
      habit.completions = Array.isArray(habit.completions) ? habit.completions : [];
      const earned = Array.isArray(habit.earnedDates) ? habit.earnedDates : [...habit.completions];
      migrated.xpEvents.forEach((event) => {
        if (event.type === "habit" && typeof event.refId === "string") {
          const separator = event.refId.lastIndexOf(":");
          if (event.refId.slice(0, separator) === habit.id && isDateKey(event.refId.slice(separator + 1))) {
            earned.push(event.refId.slice(separator + 1));
          }
        }
      });
      habit.earnedDates = Array.from(new Set(earned));
    }
    const knownHabits = new Set([...migrated.habits, ...migrated.habitArchive].map((habit) => habit.id));
    const deletedHistory = new Map();
    migrated.xpEvents.forEach((event) => {
      if (event.type !== "habit" || typeof event.refId !== "string") return;
      const separator = event.refId.lastIndexOf(":");
      const id = event.refId.slice(0, separator);
      const date = event.refId.slice(separator + 1);
      if (separator < 1 || knownHabits.has(id) || !isDateKey(date)) return;
      if (!deletedHistory.has(id)) deletedHistory.set(id, { id, name: "Thói quen đã xóa", icon: "✓", color: HABIT_COLORS[0], createdAt: dateFromKey(date).toISOString(), completions: [], earnedDates: [] });
      deletedHistory.get(id).earnedDates.push(date);
    });
    migrated.habitArchive.push(...deletedHistory.values());
    return { data: migrated, migrated: true };
  }

  function validateData(data) {
    if (!isPlainObject(data) || data.version !== DATA_VERSION || !isPlainObject(data.settings)
      || !Array.isArray(data.focusSessions) || !Array.isArray(data.tasks) || !Array.isArray(data.habits) || !Array.isArray(data.habitArchive)
      || !Array.isArray(data.xpEvents) || !Array.isArray(data.achievements)
      || !isPlainObject(data.dailyTargets)) return "Cấu trúc dữ liệu không đúng phiên bản FocusForge.";
    const { dailyGoalMinutes, defaultDurationMinutes } = data.settings;
    if (!Number.isInteger(dailyGoalMinutes) || dailyGoalMinutes < 15 || dailyGoalMinutes > 600
      || !Number.isInteger(defaultDurationMinutes) || defaultDurationMinutes < 1 || defaultDurationMinutes > 180) {
      return "Thiết lập Focus trong tệp nhập không hợp lệ.";
    }
    const sessionIds = new Set();
    for (const session of data.focusSessions) {
      if (!isPlainObject(session) || typeof session.id !== "string" || !session.id || sessionIds.has(session.id)
        || typeof session.task !== "string" || !session.task.trim() || session.task.length > 100 || !Number.isInteger(session.expectedMinutes)
        || session.expectedMinutes < 1 || session.expectedMinutes > 180
        || !Number.isFinite(session.actualMs) || session.actualMs < 0
        || typeof session.startedAt !== "string" || Number.isNaN(Date.parse(session.startedAt))
        || typeof session.endedAt !== "string" || Number.isNaN(Date.parse(session.endedAt))
        || Date.parse(session.endedAt) < Date.parse(session.startedAt)
        || session.actualMs > session.expectedMinutes * 60000
        || !["completed", "interrupted"].includes(session.status)
        || typeof session.valid !== "boolean"
        || session.valid !== (session.actualMs >= MIN_FOCUS_MINUTES * 60000)) return "Một phiên Focus trong tệp nhập không hợp lệ.";
      sessionIds.add(session.id);
    }
    const habitIds = new Set();
    for (const habit of [...data.habits, ...data.habitArchive]) {
      if (!isPlainObject(habit) || typeof habit.id !== "string" || habitIds.has(habit.id)
        || typeof habit.name !== "string" || !habit.name.trim() || habit.name.length > 70
        || typeof habit.icon !== "string" || typeof habit.createdAt !== "string" || Number.isNaN(Date.parse(habit.createdAt))
        || !HABIT_COLORS.includes(habit.color)
        || !Array.isArray(habit.completions) || !habit.completions.every(isDateKey)
        || new Set(habit.completions).size !== habit.completions.length
        || !Array.isArray(habit.earnedDates) || !habit.earnedDates.every(isDateKey)
        || new Set(habit.earnedDates).size !== habit.earnedDates.length
        || habit.completions.some((date) => !habit.earnedDates.includes(date))) return "Một thói quen trong tệp nhập không hợp lệ.";
      habitIds.add(habit.id);
    }
    if (typeof data.createdAt !== "string" || Number.isNaN(Date.parse(data.createdAt))) return "Thời điểm tạo dữ liệu không hợp lệ.";
    if (data.dateCheckpoint !== undefined && (!isPlainObject(data.dateCheckpoint)
      || !isDateKey(data.dateCheckpoint.date) || typeof data.dateCheckpoint.observedAt !== "string"
      || Number.isNaN(Date.parse(data.dateCheckpoint.observedAt)))) return "Mốc kiểm tra ngày trong dữ liệu không hợp lệ.";
    for (const [date, target] of Object.entries(data.dailyTargets)) {
      if (!isDateKey(date) || !Number.isInteger(target) || target < 15 || target > 600) return "Có mục tiêu ngày không hợp lệ trong tệp nhập.";
    }
    const xpIds = new Set();
    for (const event of data.xpEvents) {
      if (!isPlainObject(event) || typeof event.id !== "string" || xpIds.has(event.id)
        || !Number.isInteger(event.points) || event.points <= 0 || !isDateKey(event.date)
        || typeof event.type !== "string" || typeof event.refId !== "string"
        || !["focus", "habit", "daily-goal"].includes(event.type)
        || event.points !== ({ focus: 10, habit: 5, "daily-goal": 15 })[event.type]
        || event.id !== `${event.type === "daily-goal" ? "goal" : event.type}:${event.refId}`) return "Một sự kiện XP trong tệp nhập không hợp lệ.";
      if (event.type === "focus") {
        const session = data.focusSessions.find((item) => item.id === event.refId && item.valid);
        if (!session || localDate(new Date(session.endedAt)) !== event.date) return "XP phiên Focus không khớp lịch sử phiên.";
      } else if (event.type === "habit") {
        const separator = event.refId.lastIndexOf(":");
        const habitId = event.refId.slice(0, separator);
        const date = event.refId.slice(separator + 1);
        const habit = [...data.habits, ...data.habitArchive].find((item) => item.id === habitId);
        if (separator < 1 || date !== event.date || !habit || !habit.earnedDates.includes(date)) return "XP thói quen không khớp lịch sử hoàn thành.";
      } else {
        const minutes = data.focusSessions
          .filter((item) => item.valid && localDate(new Date(item.endedAt)) === event.date)
          .reduce((sum, item) => sum + item.actualMs / 60000, 0);
        const target = data.dailyTargets[event.date] || data.settings.dailyGoalMinutes;
        if (event.refId !== event.date || minutes < target) return "XP mục tiêu ngày không khớp dữ liệu Focus.";
      }
      xpIds.add(event.id);
    }
    const achievementIds = new Set();
    for (const achievement of data.achievements) {
      const definition = isPlainObject(achievement) && ACHIEVEMENTS.find((item) => item.id === achievement.id);
      if (!isPlainObject(achievement) || !ACHIEVEMENTS.some((item) => item.id === achievement.id)
        || achievementIds.has(achievement.id) || typeof achievement.unlockedAt !== "string"
        || Number.isNaN(Date.parse(achievement.unlockedAt))
        || !definition.test(data)) return "Một thành tích trong tệp nhập không hợp lệ hoặc chưa đủ điều kiện.";
      achievementIds.add(achievement.id);
    }
    return "";
  }

  function validTimer(timer) {
    return isPlainObject(timer) && typeof timer.id === "string" && typeof timer.task === "string"
      && Number.isInteger(timer.expectedMinutes) && timer.expectedMinutes >= 1 && timer.expectedMinutes <= 180
      && ["running", "paused", "pending-save"].includes(timer.status)
      && Number.isFinite(timer.accumulatedMs) && timer.accumulatedMs >= 0
      && timer.accumulatedMs <= timer.expectedMinutes * 60000
      && typeof timer.startedAt === "string" && !Number.isNaN(Date.parse(timer.startedAt))
      && Number.isFinite(timer.phaseStartedAt) && Number.isFinite(timer.phaseEndsAt)
      && timer.phaseEndsAt >= timer.phaseStartedAt
      && (timer.status !== "paused" || (Number.isFinite(timer.remainingMs) && timer.remainingMs >= 0))
      && (timer.status !== "pending-save" || (Number.isFinite(timer.actualMs) && timer.actualMs >= 0
        && timer.actualMs <= timer.expectedMinutes * 60000 && typeof timer.endedAt === "string"
        && !Number.isNaN(Date.parse(timer.endedAt)) && ["completed", "interrupted"].includes(timer.completionType)));
  }

  function loadData() {
    state.data = createDefaultData();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw !== null) {
        const imported = migrateData(JSON.parse(raw));
        const issue = validateData(imported.data);
        if (issue) throw new Error(issue);
        state.data = imported.data;
        if (imported.migrated && saveData()) showToast("Đã nâng cấp và giữ lại dữ liệu FocusForge.");
      }
      const today = localDate();
      if (!Object.hasOwn(state.data.dailyTargets, today)) {
        state.data.dailyTargets[today] = state.data.settings.dailyGoalMinutes;
        saveData();
      }
    } catch (error) {
      state.storageReadFailed = true;
      showToast(`Không thể đọc dữ liệu FocusForge. Đang dùng bộ nhớ phiên này; dữ liệu cũ chưa bị ghi đè. ${error.message}`, true);
    }
    try {
      const rawTimer = localStorage.getItem(TIMER_KEY);
      if (!rawTimer) return;
      const timer = JSON.parse(rawTimer);
      if (!validTimer(timer)) throw new Error("Trạng thái bộ đếm không hợp lệ.");
      state.timer = timer;
      if (timer.status === "running" && Date.now() >= timer.phaseEndsAt) completeTimer();
    } catch (error) {
      showToast(`Không thể khôi phục phiên Focus đang chạy: ${error.message}`, true);
      state.timer = null;
    }
  }

  function validTime(value) {
    return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  }

  function validSchedule(schedule) {
    if (!isPlainObject(schedule) || typeof schedule.id !== "string" || !schedule.id
      || typeof schedule.title !== "string" || !schedule.title.trim() || schedule.title.length > 120
      || !isDateKey(schedule.date) || !validTime(schedule.startTime) || !validTime(schedule.endTime)
      || schedule.endTime <= schedule.startTime
      || !["Study", "Focus", "Project", "Exercise", "Personal", "Rest"].includes(schedule.type)
      || typeof schedule.notes !== "string" || schedule.notes.length > 500
      || !isPlainObject(schedule.recurrence)
      || !["none", "daily", "weekly", "weekdays"].includes(schedule.recurrence.frequency)
      || !Array.isArray(schedule.recurrence.weekdays)
      || !schedule.recurrence.weekdays.every((day) => Number.isInteger(day) && day >= 0 && day <= 6)
      || new Set(schedule.recurrence.weekdays).size !== schedule.recurrence.weekdays.length
      || !Array.isArray(schedule.completedDates) || !schedule.completedDates.every(isDateKey)
      || new Set(schedule.completedDates).size !== schedule.completedDates.length
      || !Array.isArray(schedule.excludedDates) || !schedule.excludedDates.every(isDateKey)
      || new Set(schedule.excludedDates).size !== schedule.excludedDates.length
      || !isPlainObject(schedule.overrides)) return false;
    if ((schedule.recurrence.frequency === "weekdays" && schedule.recurrence.weekdays.length === 0)
      || (schedule.recurrence.frequency !== "weekdays" && schedule.recurrence.weekdays.length !== 0)) return false;
    return Object.entries(schedule.overrides).every(([date, override]) => isDateKey(date)
      && isPlainObject(override) && typeof override.title === "string" && !!override.title.trim()
      && override.title.length <= 120 && validTime(override.startTime) && validTime(override.endTime)
      && override.endTime > override.startTime
      && ["Study", "Focus", "Project", "Exercise", "Personal", "Rest"].includes(override.type)
      && typeof override.notes === "string" && override.notes.length <= 500);
  }

  function loadCalendarSchedules() {
    try {
      const raw = localStorage.getItem(CALENDAR_STORAGE_KEY);
      if (raw === null) return;
      const stored = JSON.parse(raw);
      if (!isPlainObject(stored) || stored.version !== 1 || !Array.isArray(stored.schedules)
        || !stored.schedules.every(validSchedule)
        || new Set(stored.schedules.map((item) => item.id)).size !== stored.schedules.length) {
        throw new Error("Dữ liệu lịch cá nhân không đúng cấu trúc.");
      }
      state.calendarSchedules = stored.schedules;
    } catch (error) {
      state.calendarReadFailed = true;
      showToast(`Không thể đọc dữ liệu lịch. Dữ liệu cũ chưa bị ghi đè. ${error instanceof Error ? error.message : String(error)}`, true);
    }
  }

  function saveCalendarSchedules(options = {}) {
    if (state.calendarReadFailed) {
      showToast("Dữ liệu lịch hiện có không đọc được nên không thể ghi đè.", true);
      return false;
    }
    try {
      localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify({ version: 1, schedules: state.calendarSchedules }));
      if (options.syncCloud !== false) queueCloudSync();
      return true;
    } catch (error) {
      showToast(`Không thể lưu lịch trình trên thiết bị: ${error instanceof Error ? error.message : String(error)}`, true);
      return false;
    }
  }

  function mergeRecords(localRecords, cloudRecords, mergeRecord = (_local, remote) => remote) {
    const merged = new Map();
    localRecords.forEach((record) => merged.set(record.id, record));
    cloudRecords.forEach((record) => {
      const localRecord = merged.get(record.id);
      merged.set(record.id, localRecord ? mergeRecord(localRecord, record) : record);
    });
    return Array.from(merged.values());
  }

  function mergeProgress(localData, cloudData, cloudSchedules = [], localSchedules = state.calendarSchedules) {
    const mergeHabit = (localHabit, cloudHabit) => ({
      ...localHabit,
      ...cloudHabit,
      completions: Array.from(new Set([...localHabit.completions, ...cloudHabit.completions])).sort(),
      earnedDates: Array.from(new Set([...localHabit.earnedDates, ...cloudHabit.earnedDates])).sort()
    });
    const habits = mergeRecords(localData.habits, cloudData.habits, mergeHabit);
    const activeHabitIds = new Set(habits.map((habit) => habit.id));
    const habitArchive = mergeRecords(localData.habitArchive, cloudData.habitArchive, mergeHabit)
      .filter((habit) => !activeHabitIds.has(habit.id));
    const schedules = mergeRecords(localSchedules, cloudSchedules, (local, cloud) => ({
      ...local,
      ...cloud,
      completedDates: Array.from(new Set([...local.completedDates, ...cloud.completedDates])).sort(),
      excludedDates: Array.from(new Set([...local.excludedDates, ...cloud.excludedDates])).sort(),
      overrides: { ...local.overrides, ...cloud.overrides }
    }));
    return {
      data: {
        ...localData,
        ...cloudData,
        settings: { ...localData.settings, ...cloudData.settings },
        dailyTargets: { ...localData.dailyTargets, ...cloudData.dailyTargets },
        focusSessions: mergeRecords(localData.focusSessions, cloudData.focusSessions || []),
        tasks: mergeRecords(localData.tasks, cloudData.tasks),
        habits,
        habitArchive,
        xpEvents: mergeRecords(localData.xpEvents, cloudData.xpEvents),
        achievements: mergeRecords(localData.achievements, cloudData.achievements)
      },
      schedules
    };
  }

  function cloudDocumentRef(user = state.user) {
    if (!state.firebase || !user) throw new Error("Chưa có tài khoản Firebase đang đăng nhập.");
    return state.firebase.doc(state.firebase.db, "users", user.uid, "data", "progress");
  }

  function cloudSessionsCollection(user = state.user) {
    if (!state.firebase || !user) throw new Error("Chưa có tài khoản Firebase đang đăng nhập.");
    return state.firebase.collection(state.firebase.db, "users", user.uid, "focusSessions");
  }

  function accountCacheKey(uid) {
    return `focusforge.account-cache.${encodeURIComponent(uid)}`;
  }

  function archiveLocalAccount(uid) {
    if (!uid) return;
    const localData = localStorage.getItem(STORAGE_KEY);
    const localCalendar = localStorage.getItem(CALENDAR_STORAGE_KEY);
    if (localData === null || localCalendar === null) {
      throw new Error("Không thể lưu bản cục bộ đầy đủ trước khi đổi tài khoản. Dữ liệu hiện tại chưa bị thay thế.");
    }
    localStorage.setItem(accountCacheKey(uid), JSON.stringify({ data: localData, calendar: localCalendar }));
  }

  function readAccountCache(uid) {
    const rawCache = localStorage.getItem(accountCacheKey(uid));
    if (rawCache === null) return null;
    const cache = JSON.parse(rawCache);
    if (!isPlainObject(cache) || typeof cache.data !== "string" || typeof cache.calendar !== "string") {
      throw new Error("Bản lưu cục bộ của tài khoản chưa đầy đủ; dữ liệu hiện tại chưa bị thay thế.");
    }
    const rawData = cache.data;
    const rawCalendar = cache.calendar;
    const migrated = migrateData(JSON.parse(rawData));
    const dataIssue = validateData(migrated.data);
    if (dataIssue) throw new Error(`Bản lưu cục bộ của tài khoản không hợp lệ: ${dataIssue}`);
    const calendar = JSON.parse(rawCalendar);
    if (!isPlainObject(calendar) || calendar.version !== 1 || !Array.isArray(calendar.schedules)
      || !calendar.schedules.every(validSchedule)
      || new Set(calendar.schedules.map((schedule) => schedule.id)).size !== calendar.schedules.length) {
      throw new Error("Bản lưu lịch cục bộ của tài khoản không hợp lệ.");
    }
    return { data: migrated.data, schedules: calendar.schedules };
  }

  function cloudSessionRef(sessionId, user = state.user) {
    const encodedId = encodeURIComponent(sessionId);
    if (!encodedId || encodedId.length > 1400) throw new Error("ID phiên Focus vượt quá giới hạn lưu trữ đám mây.");
    return state.firebase.doc(cloudSessionsCollection(user), encodedId);
  }

  function cloudPayloadData(value) {
    if (!isPlainObject(value) || value.schemaVersion !== 1 || !isPlainObject(value.appData)
      || !Array.isArray(value.calendarSchedules) || !value.calendarSchedules.every(validSchedule)
      || new Set(value.calendarSchedules.map((schedule) => schedule.id)).size !== value.calendarSchedules.length) {
      throw new Error("Dữ liệu FocusForge trên Firestore không hợp lệ.");
    }
    const appData = { ...value.appData, focusSessions: Array.isArray(value.appData.focusSessions) ? value.appData.focusSessions : [] };
    return { appData, calendarSchedules: value.calendarSchedules };
  }

  function cloudSignature(appData, schedules, sessionIds = appData.focusSessions.map((session) => session.id)) {
    const { focusSessions: _focusSessions, ...profileData } = appData;
    return JSON.stringify({
      appData: profileData,
      calendarSchedules: schedules,
      focusSessionIds: [...sessionIds].sort()
    });
  }

  function writeLocalCloudState(appData, schedules, cloudSessionIds = appData.focusSessions.map((session) => session.id)) {
    const previousData = state.data;
    const previousSchedules = state.calendarSchedules;
    const previousStorageReadFailed = state.storageReadFailed;
    const previousCalendarReadFailed = state.calendarReadFailed;
    state.data = appData;
    state.calendarSchedules = schedules;
    state.storageReadFailed = false;
    state.calendarReadFailed = false;
    const dataSaved = saveData({ syncCloud: false });
    const calendarSaved = saveCalendarSchedules({ syncCloud: false });
    if (!dataSaved || !calendarSaved) {
      state.data = previousData;
      state.calendarSchedules = previousSchedules;
      state.storageReadFailed = previousStorageReadFailed;
      state.calendarReadFailed = previousCalendarReadFailed;
      if (dataSaved) saveData({ syncCloud: false });
      state.cloudReady = false;
      renderAll();
      renderCalendarAndSchedules();
      throw new Error("Không thể lưu bản đồng bộ an toàn vào bộ nhớ cục bộ.");
    }
    state.cloudSessionIds = new Set(cloudSessionIds);
    state.cloudContentSignature = cloudSignature(appData, schedules, cloudSessionIds);
    renderAll();
    renderCalendarAndSchedules();
  }

  function renderAuthState(user) {
    const headerAvatar = $("#auth-avatar-button");
    const sideAvatar = $(".profile-avatar");
    const initials = user
      ? (user.displayName || user.email || "U").trim().split(/\s+/).slice(0, 2).map((part) => Array.from(part)[0] || "").join("").toLocaleUpperCase("vi")
      : "FF";
    [headerAvatar, sideAvatar].forEach((avatar) => {
      avatar.replaceChildren();
      if (user?.photoURL) {
        const image = document.createElement("img");
        image.src = user.photoURL;
        image.alt = "";
        image.referrerPolicy = "no-referrer";
        avatar.append(image);
      } else {
        avatar.textContent = initials;
      }
    });
    headerAvatar.setAttribute("aria-label", user ? `Tài khoản ${user.displayName || user.email}` : "Đăng nhập");
    headerAvatar.title = user ? (user.email || user.displayName || "Tài khoản FocusForge") : "Đăng nhập FocusForge";
    $(".profile-copy strong").textContent = user ? (user.displayName || user.email || "Tài khoản FocusForge") : "Không gian cá nhân";
    $(".profile-copy small").textContent = user
      ? (state.cloudReady ? (state.cloudError ? "Lỗi đồng bộ · dữ liệu cục bộ giữ nguyên" : "Đã kết nối đồng bộ") : state.cloudLoading ? "Đang tải dữ liệu đám mây…" : "Chưa đồng bộ · chỉ lưu cục bộ")
      : "Dữ liệu trên thiết bị";
    $("#account-popover-name").textContent = user?.displayName || "Không gian cá nhân";
    $("#account-popover-email").textContent = user?.email || (user ? "Đã đăng nhập với Google" : "Chưa đăng nhập");
    $("#account-sign-in").hidden = Boolean(user);
    $("#account-sign-out").hidden = !user;
    updateAuthAvailability();
  }

  function updateAuthAvailability() {
    const disabled = !state.firebase || state.authBusy;
    $("#auth-google").disabled = disabled;
    $("#auth-submit").disabled = disabled;
    $("#auth-mode-toggle").disabled = disabled || state.authBusy;
  }

  function setAuthError(message) {
    const errorNode = $("#auth-error");
    errorNode.textContent = message;
    errorNode.hidden = !message;
  }

  function authErrorText(error) {
    const messages = {
      "auth/invalid-email": "Địa chỉ email không hợp lệ.",
      "auth/invalid-credential": "Email hoặc mật khẩu không chính xác.",
      "auth/user-not-found": "Không tìm thấy tài khoản với email này.",
      "auth/wrong-password": "Email hoặc mật khẩu không chính xác.",
      "auth/email-already-in-use": "Email này đã được đăng ký.",
      "auth/weak-password": "Mật khẩu cần có ít nhất 6 ký tự.",
      "auth/popup-closed-by-user": "Cửa sổ đăng nhập Google đã bị đóng.",
      "auth/popup-blocked": "Trình duyệt đã chặn cửa sổ đăng nhập. Hãy cho phép popup rồi thử lại.",
      "auth/unauthorized-domain": "Tên miền hiện tại chưa được thêm vào Authorized domains trong Firebase Authentication."
    };
    return messages[error?.code] || `Không thể xác thực: ${error?.message || String(error)}`;
  }

  function openAuthModal() {
    $("#account-popover").hidden = true;
    $("#auth-avatar-button").setAttribute("aria-expanded", "false");
    $("#auth-modal").hidden = false;
    setAuthError(state.firebase ? "" : (state.firebaseError || "Đang kết nối dịch vụ xác thực…"));
    $("#auth-email").focus();
  }

  function closeAuthModal() {
    $("#auth-modal").hidden = true;
    setAuthError("");
    $("#auth-avatar-button").focus();
  }

  function showAuthFailure(error) {
    const message = authErrorText(error);
    setAuthError(message);
    showToast(message, true);
  }

  function setAuthBusy(busy) {
    state.authBusy = busy;
    updateAuthAvailability();
  }

  async function signInWithGoogle() {
    if (!state.firebase || state.authBusy) return;
    setAuthError("");
    setAuthBusy(true);
    try {
      const provider = new state.firebase.GoogleAuthProvider();
      await state.firebase.signInWithPopup(state.firebase.auth, provider);
      closeAuthModal();
    } catch (error) {
      showAuthFailure(error);
    } finally {
      setAuthBusy(false);
    }
  }

  async function submitEmailAuth(event) {
    event.preventDefault();
    if (!state.firebase || state.authBusy) return;
    const form = $("#auth-form");
    if (!form.reportValidity()) return;
    const email = $("#auth-email").value.trim();
    const password = $("#auth-password").value;
    setAuthError("");
    setAuthBusy(true);
    try {
      if ($("#auth-form").dataset.mode === "register") {
        await state.firebase.createUserWithEmailAndPassword(state.firebase.auth, email, password);
      } else {
        await state.firebase.signInWithEmailAndPassword(state.firebase.auth, email, password);
      }
      closeAuthModal();
    } catch (error) {
      showAuthFailure(error);
    } finally {
      setAuthBusy(false);
    }
  }

  async function signOutCurrentUser() {
    if (!state.firebase || state.authBusy) return;
    setAuthBusy(true);
    try {
      await state.firebase.signOut(state.firebase.auth);
      $("#account-popover").hidden = true;
      $("#auth-avatar-button").setAttribute("aria-expanded", "false");
      showToast("Đã đăng xuất. Dữ liệu cục bộ vẫn được giữ trên thiết bị.");
    } catch (error) {
      showToast(authErrorText(error), true);
    } finally {
      setAuthBusy(false);
    }
  }

  function cloudSyncSnapshot() {
    const { focusSessions, ...appData } = state.data;
    return { appData, calendarSchedules: state.calendarSchedules, focusSessions };
  }

  function queueCloudSync() {
    if (!state.firebase || !state.user || !state.cloudReady) return;
    window.clearTimeout(state.cloudSaveTimeout);
    state.cloudSaveTimeout = window.setTimeout(() => {
      state.cloudSaveTimeout = 0;
      void persistCloudSnapshot();
    }, 500);
  }

  async function persistCloudSnapshot() {
    if (!state.firebase || !state.user || !state.cloudReady) return false;
    const user = state.user;
    const { appData, calendarSchedules, focusSessions } = cloudSyncSnapshot();
    const profileData = { schemaVersion: 1, appData, calendarSchedules };
    const signature = cloudSignature(state.data, calendarSchedules, focusSessions.map((session) => session.id));
    if (signature === state.cloudContentSignature
      && focusSessions.every((session) => state.cloudSessionIds?.has(session.id))) return true;

    try {
      const profileSize = new Blob([JSON.stringify(profileData)]).size;
      if (profileSize > 700 * 1024) {
        throw new Error("Tasks, lịch và dữ liệu tiến trình vượt ngưỡng an toàn 700 KiB cho một document. Phiên Focus đã được tách riêng; hãy giảm bớt dữ liệu Tasks/Lịch để tiếp tục đồng bộ.");
      }
      const newSessions = focusSessions.filter((session) => !state.cloudSessionIds?.has(session.id));
      for (let offset = 0; offset < newSessions.length; offset += 400) {
        if (state.user?.uid !== user.uid) return;
        const batch = state.firebase.writeBatch(state.firebase.db);
        const batchSessions = newSessions.slice(offset, offset + 400);
        batchSessions.forEach((session) => batch.set(cloudSessionRef(session.id, user), session));
        await batch.commit();
        batchSessions.forEach((session) => state.cloudSessionIds.add(session.id));
      }
      if (state.user?.uid !== user.uid) return;
      await state.firebase.setDoc(cloudDocumentRef(user), { ...profileData, updatedAt: new Date().toISOString() });
      if (state.user?.uid === user.uid) {
        state.cloudContentSignature = signature;
        state.cloudError = "";
        renderAuthState(user);
      }
      return true;
    } catch (error) {
      if (state.user?.uid === user.uid) {
        state.cloudError = error.message;
        renderAuthState(user);
        showToast(`Không thể đồng bộ lên Firestore. Dữ liệu vẫn được giữ cục bộ. ${error.message}`, true);
      }
      return false;
    }
  }

  async function clearCloudFocusSessions(user) {
    if (!state.firebase || !user || state.user?.uid !== user.uid || !state.cloudReady) return true;
    window.clearTimeout(state.cloudSaveTimeout);
    state.cloudSaveTimeout = 0;
    state.cloudReady = false;
    state.cloudError = "";
    if (state.cloudUnsubscribe) state.cloudUnsubscribe();
    state.cloudUnsubscribe = null;
    try {
      const ids = Array.from(state.cloudSessionIds);
      for (let offset = 0; offset < ids.length; offset += 400) {
        const batch = state.firebase.writeBatch(state.firebase.db);
        ids.slice(offset, offset + 400).forEach((id) => batch.delete(cloudSessionRef(id, user)));
        await batch.commit();
      }
      if (state.user?.uid !== user.uid) return false;
      state.cloudSessionIds.clear();
      state.cloudContentSignature = "";
      state.cloudReady = true;
      if (!await persistCloudSnapshot()) {
        state.cloudReady = false;
        return false;
      }
      await handleAuthState(user);
      return true;
    } catch (error) {
      state.cloudReady = false;
      showToast(`Không thể xóa phiên Focus khỏi Firestore. Dữ liệu cục bộ đã được xóa nhưng bản sao đám mây chưa đổi. ${error.message}`, true);
      return false;
    }
  }

  function applyCloudSnapshot(profileSnapshot, sessionSnapshot, user, generation) {
    if (!profileSnapshot.exists() || state.user?.uid !== user.uid || state.authGeneration !== generation) return;
    try {
      const { appData: profileData, calendarSchedules } = cloudPayloadData(profileSnapshot.data());
      const focusSessions = sessionSnapshot.docs.map((sessionDoc) => ({ id: sessionDoc.id, ...sessionDoc.data() }));
      const appData = { ...profileData, focusSessions: mergeRecords(profileData.focusSessions, focusSessions) };
      const issue = validateData(appData);
      if (issue) throw new Error(issue);
      const signature = cloudSignature(appData, calendarSchedules, appData.focusSessions.map((session) => session.id));
      if (signature === state.cloudContentSignature) {
        state.cloudSessionIds = new Set(focusSessions.map((session) => session.id));
        return;
      }
      writeLocalCloudState(appData, calendarSchedules, focusSessions.map((session) => session.id));
      state.cloudReady = true;
      state.cloudContentSignature = signature;
      state.cloudError = "";
      localStorage.setItem(CLOUD_OWNER_KEY, user.uid);
      showToast("Đã nhận tiến trình mới từ Firestore.");
    } catch (error) {
      state.cloudReady = false;
      state.cloudError = error.message;
      renderAuthState(user);
      showToast(`Không thể áp dụng dữ liệu Firestore. Dữ liệu cục bộ được giữ nguyên. ${error.message}`, true);
    }
  }

  function sanitizeFirestoreDiagnostic(value) {
    return String(value || "Unknown error")
      .replace(/https?:\/\/\S+/gi, "[URL]")
      .replace(/\bBearer\s+\S+/gi, "Bearer [REDACTED]")
      .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[EMAIL]")
      .replace(/\bAIza[0-9A-Za-z_-]{20,}\b/g, "[API KEY]")
      .replace(/\beyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, "[TOKEN]")
      .replace(/(users\/)[^/\s?#]+/gi, "$1[UID]")
      .slice(0, 300);
  }

  async function readFirestoreWithDiagnostics(operation, read) {
    const startedAt = new Date();
    const startedOnline = navigator.onLine;
    const startedMonotonic = performance.now();
    console.info("[Firestore diagnostic] read started", {
      operation,
      startedAt: startedAt.toISOString(),
      navigatorOnline: startedOnline
    });

    try {
      const result = await read();
      console.info("[Firestore diagnostic] read completed", {
        operation,
        startedAt: startedAt.toISOString(),
        endedAt: new Date().toISOString(),
        durationMs: Math.round(performance.now() - startedMonotonic),
        navigatorOnline: { started: startedOnline, ended: navigator.onLine },
        outcome: "success"
      });
      return result;
    } catch (error) {
      const errorCode = typeof error?.code === "string"
        ? error.code.replace(/[^a-zA-Z0-9/_-]/g, "").slice(0, 80) || "unknown"
        : "unknown";
      console.error("[Firestore diagnostic] read failed", {
        operation,
        startedAt: startedAt.toISOString(),
        endedAt: new Date().toISOString(),
        durationMs: Math.round(performance.now() - startedMonotonic),
        navigatorOnline: { started: startedOnline, ended: navigator.onLine },
        errorCode,
        errorMessage: sanitizeFirestoreDiagnostic(error?.message)
      });
      throw error;
    }
  }

  async function loadUserCloudData(user, generation) {
    const previousOwner = localStorage.getItem(CLOUD_OWNER_KEY);
    const profileRef = cloudDocumentRef(user);
    const sessionsRef = cloudSessionsCollection(user);
    const [profileSnapshot, sessionSnapshot] = await Promise.all([
      readFirestoreWithDiagnostics("getDoc(progress)", () => state.firebase.getDoc(profileRef)),
      readFirestoreWithDiagnostics("getDocs(focusSessions)", () => state.firebase.getDocs(sessionsRef))
    ]);
    if (state.user?.uid !== user.uid || state.authGeneration !== generation) return;

    if (state.storageReadFailed || state.calendarReadFailed) {
      throw new Error("Không thể xác thực đầy đủ dữ liệu cục bộ nên không thể thay thế hoặc chuyển tài khoản an toàn. Dữ liệu hiện tại chưa bị ghi đè.");
    }
    if (previousOwner && previousOwner !== user.uid) archiveLocalAccount(previousOwner);
    let localCandidate = null;
    if (!previousOwner || previousOwner === user.uid) {
      localCandidate = { data: state.data, schedules: state.calendarSchedules };
    } else if (previousOwner && previousOwner !== user.uid) {
      localCandidate = readAccountCache(user.uid);
    }

    const existingSessions = sessionSnapshot.docs.map((sessionDoc) => ({ id: sessionDoc.id, ...sessionDoc.data() }));
    if (!existingSessions.every((session) => isPlainObject(session))) {
      throw new Error("Có phiên Focus không hợp lệ trên Firestore.");
    }
    state.cloudSessionIds = new Set(existingSessions.map((session) => session.id));

    let appData;
    let schedules;
    if (profileSnapshot.exists()) {
      const cloud = cloudPayloadData(profileSnapshot.data());
      const cloudData = { ...cloud.appData, focusSessions: mergeRecords(cloud.appData.focusSessions, existingSessions) };
      const issue = validateData(cloudData);
      if (issue) throw new Error(issue);
      if (!localCandidate) {
        appData = cloudData;
        schedules = cloud.calendarSchedules;
      } else {
        const merged = mergeProgress(localCandidate.data, cloudData, cloud.calendarSchedules, localCandidate.schedules);
        const mergedIssue = validateData(merged.data);
        if (mergedIssue) {
          showToast(`Dữ liệu cục bộ không thể hợp nhất an toàn; đang tải bản Firestore đã xác thực. ${mergedIssue}`, true);
          appData = cloudData;
          schedules = cloud.calendarSchedules;
        } else {
          appData = merged.data;
          schedules = merged.schedules;
        }
      }
    } else if (!localCandidate && previousOwner && previousOwner !== user.uid) {
      appData = { ...createDefaultData(), focusSessions: existingSessions };
      schedules = [];
    } else {
      if (!localCandidate) {
        throw new Error("Không thể khởi tạo tài khoản mới vì dữ liệu localStorage chưa đọc được. Bản cục bộ chưa bị ghi đè.");
      }
      const localWithCloudSessions = { ...localCandidate.data, focusSessions: mergeRecords(localCandidate.data.focusSessions, existingSessions) };
      appData = localWithCloudSessions;
      schedules = localCandidate.schedules;
    }

    const finalIssue = validateData(appData);
    if (finalIssue) throw new Error(finalIssue);
    writeLocalCloudState(appData, schedules, existingSessions.map((session) => session.id));
    localStorage.setItem(CLOUD_OWNER_KEY, user.uid);
    state.cloudReady = true;
    if (profileSnapshot.exists()) {
      const cloud = cloudPayloadData(profileSnapshot.data());
      const cloudData = { ...cloud.appData, focusSessions: mergeRecords(cloud.appData.focusSessions, existingSessions) };
      state.cloudContentSignature = cloudSignature(cloudData, cloud.calendarSchedules, existingSessions.map((session) => session.id));
    } else {
      state.cloudContentSignature = "";
    }
    await persistCloudSnapshot();
    if (state.user?.uid !== user.uid || state.authGeneration !== generation) return;
    state.cloudReady = true;
    const profileListener = state.firebase.onSnapshot(profileRef, (snapshot) => {
      if (!snapshot.exists()) return;
      const sessionsListener = state.cloudSessionSnapshot;
      if (sessionsListener) applyCloudSnapshot(snapshot, sessionsListener, user, generation);
      state.cloudProfileSnapshot = snapshot;
    }, (error) => {
      if (state.user?.uid === user.uid) showToast(`Lỗi nhận cập nhật Firestore: ${error.message}`, true);
    });
    const sessionsListener = state.firebase.onSnapshot(sessionsRef, (snapshot) => {
      state.cloudSessionSnapshot = snapshot;
      const latestProfile = state.cloudProfileSnapshot || profileSnapshot;
      applyCloudSnapshot(latestProfile, snapshot, user, generation);
    }, (error) => {
      if (state.user?.uid === user.uid) showToast(`Lỗi nhận phiên Focus từ Firestore: ${error.message}`, true);
    });
    state.cloudUnsubscribe = () => {
      profileListener();
      sessionsListener();
      state.cloudProfileSnapshot = null;
      state.cloudSessionSnapshot = null;
    };
    renderAuthState(user);
    showToast(profileSnapshot.exists() ? "Đã tải tiến trình và kết nối đồng bộ." : "Đã lưu dữ liệu hiện có lên tài khoản mới.");
  }

  async function handleAuthState(user) {
    state.authGeneration += 1;
    const generation = state.authGeneration;
    window.clearTimeout(state.cloudSaveTimeout);
    state.cloudSaveTimeout = 0;
    state.cloudReady = false;
    if (state.cloudUnsubscribe) state.cloudUnsubscribe();
    state.cloudUnsubscribe = null;
    state.user = user;
    state.cloudError = "";
    state.cloudLoading = Boolean(user);
    renderAuthState(user);
    if (!user) {
      $("#account-popover").hidden = true;
      $("#auth-avatar-button").setAttribute("aria-expanded", "false");
      return;
    }
    try {
      await loadUserCloudData(user, generation);
      if (state.user?.uid === user.uid && state.authGeneration === generation) {
        state.cloudLoading = false;
        state.cloudError = "";
        renderAuthState(user);
      }
    } catch (error) {
      if (state.user?.uid === user.uid && state.authGeneration === generation) {
        state.cloudReady = false;
        state.cloudLoading = false;
        state.cloudError = error.message;
        renderAuthState(user);
        showToast(`Đăng nhập thành công nhưng chưa thể tải Firestore. Dữ liệu cục bộ không bị ghi lên đám mây. ${error.message}`, true);
      }
    }
  }

  function initializeFirebaseAuth() {
    if (state.firebaseInitPromise) return state.firebaseInitPromise;
    state.firebaseInitPromise = (async () => {
      try {
        const base = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}`;
        const [appSdk, authSdk, firestoreSdk] = await Promise.all([
          import(`${base}/firebase-app.js`),
          import(`${base}/firebase-auth.js`),
          import(`${base}/firebase-firestore.js`)
        ]);
        const app = appSdk.getApps().some((item) => item.name === "[DEFAULT]")
          ? appSdk.getApp()
          : appSdk.initializeApp(FIREBASE_CONFIG);
        const auth = authSdk.getAuth(app);
        const db = firestoreSdk.getFirestore(app);
        state.firebase = {
          auth,
          db,
          GoogleAuthProvider: authSdk.GoogleAuthProvider,
          signInWithPopup: authSdk.signInWithPopup,
          signInWithEmailAndPassword: authSdk.signInWithEmailAndPassword,
          createUserWithEmailAndPassword: authSdk.createUserWithEmailAndPassword,
          signOut: authSdk.signOut,
          onAuthStateChanged: authSdk.onAuthStateChanged,
          doc: firestoreSdk.doc,
          collection: firestoreSdk.collection,
          setDoc: firestoreSdk.setDoc,
          getDoc: firestoreSdk.getDoc,
          getDocs: firestoreSdk.getDocs,
          onSnapshot: firestoreSdk.onSnapshot,
          writeBatch: firestoreSdk.writeBatch
        };
        state.firebaseError = "";
        if (!$("#auth-modal").hidden) setAuthError("");
        updateAuthAvailability();
        state.authUnsubscribe = state.firebase.onAuthStateChanged(auth, (user) => {
          void handleAuthState(user);
        }, (error) => showToast(`Không thể xác định trạng thái đăng nhập: ${error.message}`, true));
      } catch (error) {
        state.firebaseError = `Firebase chưa sẵn sàng: ${error.message}. Ứng dụng vẫn dùng dữ liệu cục bộ.`;
        updateAuthAvailability();
        setAuthError(state.firebaseError);
        showToast(`Không thể tải Firebase SDK. Dữ liệu cục bộ vẫn hoạt động. ${error.message}`, true);
      }
    })();
    return state.firebaseInitPromise;
  }

  function scheduleOccursOn(schedule, dateKey) {
    if (dateKey < schedule.date || schedule.excludedDates.includes(dateKey)) return false;
    const weekday = dateFromKey(dateKey).getDay();
    const frequency = schedule.recurrence.frequency;
    if (frequency === "none") return dateKey === schedule.date;
    if (frequency === "daily") return true;
    if (frequency === "weekly") return weekday === dateFromKey(schedule.date).getDay();
    return schedule.recurrence.weekdays.includes(weekday);
  }

  function scheduleOccurrence(schedule, dateKey) {
    if (!scheduleOccursOn(schedule, dateKey)) return null;
    return {
      ...schedule,
      ...(schedule.overrides[dateKey] || {}),
      occurrenceDate: dateKey,
      completed: schedule.completedDates.includes(dateKey)
    };
  }

  function schedulesForDate(dateKey) {
    return state.calendarSchedules
      .map((schedule) => scheduleOccurrence(schedule, dateKey))
      .filter(Boolean)
      .sort((left, right) => left.startTime.localeCompare(right.startTime));
  }

  function closeScheduleForm() {
    $("#schedule-modal").hidden = true;
    $("#schedule-form").reset();
    $("#schedule-form-error").hidden = true;
    $("#schedule-edit-scope").hidden = true;
    state.editingSchedule = null;
  }

  function openScheduleForm(dateKey = state.selectedCalendarDate, scheduleId = null) {
    if (state.calendarReadFailed) {
      showToast("The saved calendar data could not be read. Check the stored data before making changes.", true);
      return;
    }
    const form = $("#schedule-form");
    form.reset();
    $("#schedule-form-error").hidden = true;
    $("#schedule-date").value = dateKey;
    $("#schedule-type").value = "Study";
    $("#schedule-start").value = "09:00";
    $("#schedule-end").value = "10:00";
    $("#schedule-repeat").value = "none";
    $("#schedule-weekdays").hidden = true;
    $("#schedule-edit-scope").hidden = true;
    state.editingSchedule = null;
    const series = scheduleId ? state.calendarSchedules.find((item) => item.id === scheduleId) : null;
    if (scheduleId && !series) {
      showToast("The schedule could not be found.", true);
      return;
    }
    if (series) {
      const occurrence = scheduleOccurrence(series, dateKey);
      if (!occurrence) {
        showToast("This schedule does not occur on the selected date.", true);
        return;
      }
      const hasRecurrence = series.recurrence.frequency !== "none";
      const values = series.overrides[dateKey] || series;
      $("#schedule-title").value = values.title;
      $("#schedule-date").value = dateKey;
      $("#schedule-type").value = values.type;
      $("#schedule-start").value = values.startTime;
      $("#schedule-end").value = values.endTime;
      $("#schedule-notes").value = values.notes;
      $("#schedule-repeat").value = series.recurrence.frequency;
      $("#schedule-weekdays").hidden = series.recurrence.frequency !== "weekdays";
      $$("#schedule-weekdays input").forEach((input) => { input.checked = series.recurrence.weekdays.includes(Number(input.value)); });
      $("#schedule-edit-scope").hidden = !hasRecurrence;
      state.editingSchedule = { id: series.id, date: dateKey };
      $("#schedule-form-title").textContent = "Edit Schedule";
    } else {
      $("#schedule-form-title").textContent = "Add Schedule";
    }
    $("#schedule-modal").hidden = false;
    $("#schedule-title").focus();
  }

  function submitSchedule(event) {
    event.preventDefault();
    const form = $("#schedule-form");
    if (!form.reportValidity()) return;
    const title = $("#schedule-title").value.trim();
    const date = $("#schedule-date").value;
    const startTime = $("#schedule-start").value;
    const endTime = $("#schedule-end").value;
    const type = $("#schedule-type").value;
    const notes = $("#schedule-notes").value.trim();
    const frequency = $("#schedule-repeat").value;
    const weekdays = frequency === "weekdays"
      ? $$("#schedule-weekdays input:checked").map((input) => Number(input.value))
      : [];
    const error = $("#schedule-form-error");
    if (!title || !isDateKey(date) || !validTime(startTime) || !validTime(endTime) || endTime <= startTime) {
      error.textContent = "Please check the details. The end time must be after the start time.";
      error.hidden = false;
      return;
    }
    if (frequency === "weekdays" && !weekdays.length) {
      error.textContent = "Choose at least one weekday for this repeat schedule.";
      error.hidden = false;
      return;
    }

    const values = { title, startTime, endTime, type, notes };
    const scope = $('input[name="schedule-scope"]:checked')?.value || "series";
    if (state.editingSchedule) {
      const schedule = state.calendarSchedules.find((item) => item.id === state.editingSchedule.id);
      if (!schedule) {
        error.textContent = "The schedule to update could not be found.";
        error.hidden = false;
        return;
      }
      const previous = JSON.stringify(schedule);
      if (schedule.recurrence.frequency !== "none" && scope === "occurrence") {
        schedule.overrides[state.editingSchedule.date] = values;
      } else {
        Object.assign(schedule, values, {
          date,
          recurrence: { frequency, weekdays: frequency === "weekdays" ? weekdays : [] }
        });
      }
      if (!validSchedule(schedule)) {
        Object.assign(schedule, JSON.parse(previous));
        error.textContent = "The schedule details are invalid. Check the repeat days and times.";
        error.hidden = false;
        return;
      }
      if (!saveCalendarSchedules()) {
        Object.assign(schedule, JSON.parse(previous));
        return;
      }
      showToast(scope === "occurrence" && schedule.recurrence.frequency !== "none"
        ? "This occurrence has been updated."
        : "The schedule has been updated.");
    } else {
      const schedule = {
        id: newId(),
        ...values,
        date,
        recurrence: { frequency, weekdays: frequency === "weekdays" ? weekdays : [] },
        completedDates: [],
        excludedDates: [],
        overrides: {}
      };
      if (!validSchedule(schedule)) {
        error.textContent = "The schedule details are invalid. Check the repeat days and times.";
        error.hidden = false;
        return;
      }
      state.calendarSchedules.push(schedule);
      if (!saveCalendarSchedules()) {
        state.calendarSchedules = state.calendarSchedules.filter((item) => item.id !== schedule.id);
        return;
      }
      state.selectedCalendarDate = date;
      state.calendarDate = date.slice(0, 7);
      showToast("Schedule added.");
    }
    closeScheduleForm();
    renderCalendarAndSchedules();
  }

  function toggleScheduleCompletion(id, date) {
    const schedule = state.calendarSchedules.find((item) => item.id === id);
    if (!schedule) return showToast("The schedule could not be found.", true);
    const oldDates = [...schedule.completedDates];
    const index = schedule.completedDates.indexOf(date);
    if (index >= 0) schedule.completedDates.splice(index, 1);
    else schedule.completedDates.push(date);
    schedule.completedDates.sort();
    if (!saveCalendarSchedules()) {
      schedule.completedDates = oldDates;
      return;
    }
    renderCalendarAndSchedules();
  }

  function deleteScheduleOccurrence(id, date, wholeSeries) {
    const index = state.calendarSchedules.findIndex((item) => item.id === id);
    if (index < 0) return showToast("The schedule to delete could not be found.", true);
    const schedule = state.calendarSchedules[index];
    const previous = JSON.stringify(schedule);
    if (wholeSeries || schedule.recurrence.frequency === "none") {
      state.calendarSchedules.splice(index, 1);
    } else if (!schedule.excludedDates.includes(date)) {
      schedule.excludedDates.push(date);
      schedule.excludedDates.sort();
    }
    if (!saveCalendarSchedules()) {
      if (wholeSeries || schedule.recurrence.frequency === "none") state.calendarSchedules.splice(index, 0, schedule);
      else Object.assign(schedule, JSON.parse(previous));
      return;
    }
    renderCalendarAndSchedules();
    showToast(wholeSeries ? "The entire schedule series has been deleted." : "This occurrence has been deleted.");
  }

  function requestDeleteSchedule(id, date) {
    const schedule = state.calendarSchedules.find((item) => item.id === id);
    if (!schedule) return showToast("The schedule to delete could not be found.", true);
    const repeats = schedule.recurrence.frequency !== "none";
    openConfirm({
      title: repeats ? "Delete This Occurrence?" : "Delete Schedule?",
      message: repeats ? `Delete "${schedule.title}" on ${formatCalendarDate(date)} or delete the entire series?` : `Delete "${schedule.title}" from your calendar?`,
      accept: repeats ? "This Occurrence" : "Delete Schedule",
      cancel: "Cancel",
      seriesLabel: "Delete Entire Series",
      onAccept: () => deleteScheduleOccurrence(id, date, false),
      onSeries: repeats ? () => deleteScheduleOccurrence(id, date, true) : null
    });
    $("#confirm-series-delete").hidden = !repeats;
  }

  function startFocusFromSchedule(id, date) {
    const schedule = state.calendarSchedules.find((item) => item.id === id);
    const occurrence = schedule && scheduleOccurrence(schedule, date);
    if (!occurrence) return showToast("The schedule could not be found.", true);
    if (state.timer) return showToast("A Focus session is already active.", true);
    $("#focus-task").value = occurrence.title;
    $("#focus-method-note").hidden = true;
    navigate("focus");
    showToast(`Ready to start Focus: ${occurrence.title}.`);
  }

  function renderCalendar() {
    const monthLabel = $("#calendar-month-label");
    const daysGrid = $("#calendar-days");
    if (!monthLabel || !daysGrid || !state.calendarDate) return;
    const [year, month] = state.calendarDate.split("-").map(Number);
    const monthDate = new Date(year, month - 1, 1, 12);
    monthLabel.textContent = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(monthDate);
    daysGrid.replaceChildren();
    const offset = (monthDate.getDay() + 6) % 7;
    const firstVisible = shiftDate(localDate(monthDate), -offset);
    const today = localDate();
    for (let index = 0; index < 42; index += 1) {
      const date = shiftDate(firstVisible, index);
      const inMonth = date.slice(0, 7) === state.calendarDate.slice(0, 7);
      const occurrences = schedulesForDate(date);
      const button = document.createElement("button");
      button.type = "button";
      button.className = `calendar-day${inMonth ? "" : " outside-month"}${date === today ? " today" : ""}${date === state.selectedCalendarDate ? " selected" : ""}${occurrences.length ? " has-schedule" : ""}`;
      button.dataset.calendarDate = date;
      button.setAttribute("role", "gridcell");
      button.setAttribute("aria-label", `${formatCalendarDate(date, true)}${occurrences.length ? `, ${occurrences.length} ${occurrences.length === 1 ? "schedule" : "schedules"}` : ""}`);
      if (date === state.selectedCalendarDate) button.setAttribute("aria-pressed", "true");
      const number = document.createElement("span");
      number.textContent = String(dateFromKey(date).getDate());
      button.append(number);
      if (occurrences.length) {
        const dot = document.createElement("i");
        dot.className = "calendar-day-dot";
        dot.setAttribute("aria-hidden", "true");
        button.append(dot);
      }
      button.addEventListener("click", () => {
        state.selectedCalendarDate = date;
        if (!inMonth) state.calendarDate = date.slice(0, 7);
        renderCalendar();
        renderScheduleList();
      });
      daysGrid.append(button);
    }
  }

  function renderScheduleList() {
    const list = $("#schedule-list");
    if (!list || !state.selectedCalendarDate) return;
    const date = state.selectedCalendarDate;
    $("#schedule-day-label").textContent = date === localDate() ? "Today's Schedule" : formatCalendarDate(date);
    const occurrences = schedulesForDate(date);
    $("#schedule-count").textContent = `${occurrences.length} ${occurrences.length === 1 ? "activity" : "activities"}`;
    list.replaceChildren();
    if (!occurrences.length) {
      const empty = document.createElement("div");
      empty.className = "schedule-empty";
      empty.textContent = "No schedules yet — add an activity to plan your day.";
      list.append(empty);
      return;
    }
    occurrences.forEach((occurrence) => {
      const item = document.createElement("article");
      item.className = `schedule-item${occurrence.completed ? " completed" : ""}`;
      const time = document.createElement("div");
      time.className = "schedule-time";
      time.textContent = `${occurrence.startTime} – ${occurrence.endTime}`;
      const content = document.createElement("div");
      content.className = "schedule-content";
      const title = document.createElement("strong");
      title.textContent = occurrence.title;
      const meta = document.createElement("span");
      meta.textContent = `${occurrence.type}${occurrence.completed ? " · Completed" : ""}`;
      content.append(title, meta);
      const actions = document.createElement("div");
      actions.className = "schedule-actions";
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "schedule-action";
      toggle.textContent = occurrence.completed ? "Undo" : "Complete";
      toggle.dataset.scheduleComplete = occurrence.id;
      toggle.dataset.occurrenceDate = date;
      toggle.setAttribute("aria-label", occurrence.completed ? `Mark as incomplete: ${occurrence.title}` : `Mark as complete: ${occurrence.title}`);
      const focus = document.createElement("button");
      focus.type = "button";
      focus.className = "schedule-action";
      focus.textContent = "Focus";
      focus.dataset.scheduleFocus = occurrence.id;
      focus.dataset.occurrenceDate = date;
      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "schedule-action";
      edit.textContent = "Edit";
      edit.dataset.scheduleEdit = occurrence.id;
      edit.dataset.occurrenceDate = date;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "schedule-action danger";
      remove.textContent = "Delete";
      remove.dataset.scheduleDelete = occurrence.id;
      remove.dataset.occurrenceDate = date;
      actions.append(toggle, focus, edit, remove);
      item.append(time, content, actions);
      list.append(item);
    });
  }

  function renderCalendarAndSchedules() {
    renderCalendar();
    renderScheduleList();
  }

  function dayOrdinal(dateKey) {
    const [year, month, day] = dateKey.split("-").map(Number);
    return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
  }

  function clockLooksChanged(now = Date.now()) {
    const checkpoint = state.data.dateCheckpoint;
    if (!checkpoint) return false;
    const today = localDate(new Date(now));
    const daysPassed = dayOrdinal(today) - dayOrdinal(checkpoint.date);
    const elapsed = now - Date.parse(checkpoint.observedAt);
    if (daysPassed < 0 || elapsed < -120000) return true;
    if (daysPassed > Math.max(2, Math.floor(elapsed / 86400000) + 1)) return true;
    if (daysPassed === 1 && elapsed >= 0 && elapsed < 120000
      && Math.abs(new Date(now).getHours() * 60 + new Date(now).getMinutes()
        - (new Date(checkpoint.observedAt).getHours() * 60 + new Date(checkpoint.observedAt).getMinutes())) < 120) return true;
    return false;
  }

  function warnClockChange() {
    if (state.clockWarningShown) return;
    state.clockWarningShown = true;
    showToast("Ngày hoặc giờ thiết bị có vẻ đã thay đổi. Streak và XP dùng ngày địa phương nên kết quả có thể không chính xác; hãy tránh chỉnh đồng hồ để nhận tiến độ.", true);
  }

  function validFocusMs(data = state.data) {
    return data.focusSessions.filter((session) => session.valid).reduce((total, session) => total + session.actualMs, 0);
  }

  function focusMinutesForDate(dateKey) {
    return state.data.focusSessions
      .filter((session) => session.valid && localDate(new Date(session.endedAt)) === dateKey)
      .reduce((total, session) => total + session.actualMs / 60000, 0);
  }

  function dailyTarget(dateKey) {
    return state.data.dailyTargets[dateKey] || state.data.settings.dailyGoalMinutes;
  }

  function goalMet(dateKey) {
    return focusMinutesForDate(dateKey) >= dailyTarget(dateKey);
  }

  function streakStats(data = state.data) {
    const previousData = state.data;
    if (data !== state.data) state.data = data;
    const achieved = new Set();
    const dates = new Set(data.focusSessions.filter((session) => session.valid).map((session) => localDate(new Date(session.endedAt))));
    for (const date of dates) {
      if (focusMinutesForDate(date) >= dailyTarget(date)) achieved.add(date);
    }
    const sorted = Array.from(achieved).sort();
    let best = 0;
    let run = 0;
    let previous = "";
    sorted.forEach((date) => {
      run = previous && shiftDate(previous, 1) === date ? run + 1 : 1;
      best = Math.max(best, run);
      previous = date;
    });
    const today = localDate();
    const anchor = achieved.has(today) ? today : shiftDate(today, -1);
    let current = 0;
    if (achieved.has(anchor)) {
      let cursor = anchor;
      while (achieved.has(cursor)) {
        current += 1;
        cursor = shiftDate(cursor, -1);
      }
    }
    if (data !== previousData) state.data = previousData;
    return { current, best, achieved };
  }

  function totalXp() {
    return state.data.xpEvents.reduce((sum, event) => sum + event.points, 0);
  }

  function addXpEvent(id, type, refId, date, points) {
    if (state.data.xpEvents.some((event) => event.id === id)) return false;
    state.data.xpEvents.push({ id, type, refId, date, points });
    return true;
  }

  function recomputeAchievements() {
    const unlocked = new Set(state.data.achievements.map((item) => item.id));
    ACHIEVEMENTS.forEach((achievement) => {
      if (!unlocked.has(achievement.id) && achievement.test(state.data)) {
        state.data.achievements.push({ id: achievement.id, unlockedAt: new Date().toISOString() });
      }
    });
  }

  function reconcileXp() {
    let changed = false;
    state.data.focusSessions.filter((session) => session.valid).forEach((session) => {
      changed = addXpEvent(`focus:${session.id}`, "focus", session.id, localDate(new Date(session.endedAt)), 10) || changed;
    });
    [...state.data.habits, ...state.data.habitArchive].forEach((habit) => {
      habit.completions.forEach((date) => {
        changed = addXpEvent(`habit:${habit.id}:${date}`, "habit", `${habit.id}:${date}`, date, 5) || changed;
      });
    });
    const achievedDates = streakStats().achieved;
    achievedDates.forEach((date) => {
      changed = addXpEvent(`goal:${date}`, "daily-goal", date, date, 15) || changed;
    });
    const before = state.data.achievements.length;
    recomputeAchievements();
    changed = state.data.achievements.length !== before || changed;
    return changed;
  }

  function formatMinutes(milliseconds, decimals = false) {
    const minutes = milliseconds / 60000;
    return decimals ? `${minutes.toFixed(1)} phút` : `${Math.floor(minutes)} phút`;
  }

  function formatDateTime(iso) {
    return new Intl.DateTimeFormat("vi-VN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
  }

  function formatLongDate(dateKey) {
    return new Intl.DateTimeFormat("vi-VN", { weekday: "short", day: "numeric", month: "short" }).format(dateFromKey(dateKey));
  }

  function formatCalendarDate(dateKey, includeYear = false) {
    const options = { month: "long", day: "numeric" };
    if (includeYear) options.year = "numeric";
    return new Intl.DateTimeFormat("en-US", options).format(dateFromKey(dateKey));
  }

  function addClass(parent, className, text) {
    const node = document.createElement("span");
    node.className = className;
    node.textContent = text;
    parent.append(node);
    return node;
  }

  function activityForDate(dateKey) {
    const sessions = state.data.focusSessions.filter((session) => session.actualMs > 0
      && localDate(new Date(session.endedAt)) === dateKey);
    const tasks = state.data.tasks.filter((task) => task.done && task.completedDate === dateKey);
    const focusMs = sessions.reduce((total, session) => total + session.actualMs, 0);
    const completedSessions = sessions.filter((session) => session.status === "completed").length;
    const taskCount = tasks.length;
    const activityScore = focusMs / 60000 + Math.min(taskCount, 3) * 10;
    const level = activityScore === 0 ? 0
      : activityScore < 25 ? 1
        : activityScore < 60 ? 2
          : activityScore < 120 ? 3 : 4;
    return { focusMinutes: Math.floor(focusMs / 60000), completedSessions, taskCount, level };
  }

  function activityYears() {
    const currentYear = new Date().getFullYear();
    const years = state.data.focusSessions
      .filter((session) => session.actualMs > 0)
      .map((session) => Number(localDate(new Date(session.endedAt)).slice(0, 4)));
    state.data.tasks.forEach((task) => {
      if (task.done && typeof task.completedDate === "string" && isDateKey(task.completedDate)) {
        years.push(Number(task.completedDate.slice(0, 4)));
      }
    });
    const oldestYear = Math.max(currentYear - 19, Math.min(currentYear - 9, years.length ? Math.min(...years) : currentYear));
    return Array.from({ length: currentYear - oldestYear + 1 }, (_, index) => oldestYear + index);
  }

  function renderActivityDetail(dateKey) {
    const detail = $("#activity-detail");
    if (!detail) return;
    const activity = activityForDate(dateKey);
    const heading = document.createElement("strong");
    heading.textContent = formatCalendarDate(dateKey, true);
    const sessions = state.data.focusSessions
      .filter((session) => localDate(new Date(session.endedAt)) === dateKey)
      .sort((left, right) => Date.parse(left.startedAt) - Date.parse(right.startedAt));
    const tasks = state.data.tasks.filter((task) => task.done && task.completedDate === dateKey);
    const schedules = schedulesForDate(dateKey).filter((schedule) => schedule.completed);
    const habits = [...state.data.habits, ...state.data.habitArchive]
      .filter((habit) => habit.completions.includes(dateKey));
    const hasActivity = sessions.length + tasks.length + schedules.length + habits.length > 0;
    detail.replaceChildren(heading);
    if (!hasActivity) {
      const empty = document.createElement("p");
      empty.className = "activity-empty";
      empty.textContent = "Ngày này chưa có hoạt động nào được ghi lại.";
      detail.append(empty);
      return;
    }

    const summary = document.createElement("div");
    summary.className = "activity-detail-summary";
    const metrics = document.createElement("span");
    metrics.textContent = `${activity.focusMinutes} phút Focus · ${activity.completedSessions} phiên hoàn thành · ${activity.taskCount} task hoàn thành`;
    const level = document.createElement("span");
    level.className = "activity-level-label";
    level.textContent = `Mức hoạt động ${activity.level} / 4`;
    summary.append(metrics, level);
    detail.append(summary);

    const appendGroup = (title, entries) => {
      if (!entries.length) return;
      const group = document.createElement("section");
      group.className = "activity-detail-group";
      const groupHeading = document.createElement("h3");
      groupHeading.textContent = title;
      const list = document.createElement("ul");
      entries.forEach(({ name, description }) => {
        const item = document.createElement("li");
        const itemName = document.createElement("strong");
        itemName.textContent = name;
        const itemDescription = document.createElement("span");
        itemDescription.textContent = description;
        item.append(itemName, itemDescription);
        list.append(item);
      });
      group.append(groupHeading, list);
      detail.append(group);
    };
    const localTime = (value) => new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
    const duration = (milliseconds) => {
      const totalMinutes = Math.max(0, Math.floor(milliseconds / 60000));
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      if (hours && minutes) return `${hours} giờ ${minutes} phút`;
      if (hours) return `${hours} giờ`;
      return `${minutes} phút`;
    };
    appendGroup("Phiên Focus", sessions.map((session) => ({
      name: session.task,
      description: `${localTime(session.startedAt)} – ${localTime(session.endedAt)} · ${duration(session.actualMs)} · ${session.status === "completed" ? "Hoàn thành" : "Kết thúc sớm"} · ${session.valid ? "Hợp lệ (từ 15 phút)" : "Dưới 15 phút"}`
    })));
    appendGroup("Task đã hoàn thành", tasks.map((task) => ({ name: task.title, description: "Đã hoàn thành trong ngày này" })));
    appendGroup("Lịch đã hoàn thành", schedules.map((schedule) => ({
      name: schedule.title,
      description: `${schedule.startTime}–${schedule.endTime} · ${schedule.type}`
    })));
    appendGroup("Thói quen đã làm", habits.map((habit) => ({ name: habit.name, description: "Đã hoàn thành trong ngày này" })));
  }

  function renderActivityCalendar() {
    const yearSelect = $("#activity-year");
    const calendar = $("#activity-calendar");
    if (!yearSelect || !calendar) return;
    const years = activityYears();
    if (!years.includes(state.activityYear)) state.activityYear = years[years.length - 1];
    yearSelect.replaceChildren();
    years.slice().reverse().forEach((year) => {
      const option = document.createElement("option");
      option.value = String(year);
      option.textContent = String(year);
      option.selected = year === state.activityYear;
      yearSelect.append(option);
    });

    const yearStart = `${state.activityYear}-01-01`;
    const yearEnd = `${state.activityYear}-12-31`;
    if (state.activitySelectedDate.slice(0, 4) !== String(state.activityYear)) {
      state.activitySelectedDate = state.activityYear === new Date().getFullYear() ? localDate() : yearEnd;
    }
    const firstDate = shiftDate(yearStart, -((dateFromKey(yearStart).getDay() + 6) % 7));
    const lastDate = shiftDate(yearEnd, 6 - ((dateFromKey(yearEnd).getDay() + 6) % 7));
    const weekCount = Math.floor((dayOrdinal(lastDate) - dayOrdinal(firstDate) + 1) / 7);
    calendar.style.setProperty("--activity-week-count", String(weekCount));
    calendar.replaceChildren();

    const months = document.createElement("div");
    months.className = "activity-months";
    months.style.setProperty("--activity-week-count", String(weekCount));
    const monthStarts = Array.from({ length: 12 }, (_, index) => {
      const date = `${state.activityYear}-${String(index + 1).padStart(2, "0")}-01`;
      return { date, column: Math.floor((dayOrdinal(date) - dayOrdinal(firstDate)) / 7) + 1 };
    });
    monthStarts.forEach(({ date, column }, index) => {
      const monthNumber = Number(date.slice(5, 7));
      const label = document.createElement("span");
      label.textContent = new Intl.DateTimeFormat("en-US", { month: "short" }).format(new Date(state.activityYear, monthNumber - 1, 1, 12));
      const nextColumn = monthStarts[index + 1]?.column || weekCount + 1;
      label.style.gridColumn = `${column} / span ${Math.max(1, nextColumn - column)}`;
      months.append(label);
    });

    const weeks = document.createElement("div");
    weeks.className = "activity-weeks";
    weeks.style.setProperty("--activity-week-count", String(weekCount));
    const weekdayLabels = document.createElement("div");
    weekdayLabels.className = "activity-weekday-labels";
    ["Mon", "Wed", "Fri"].forEach((label) => {
      const item = document.createElement("span");
      item.textContent = label;
      weekdayLabels.append(item);
    });
    const grid = document.createElement("div");
    grid.className = "activity-grid";
    grid.style.setProperty("--activity-week-count", String(weekCount));
    let yearMinutes = 0;
    let yearTasks = 0;
    let activeDays = 0;
    for (let index = 0; index < weekCount * 7; index += 1) {
      const date = shiftDate(firstDate, index);
      const inYear = date.slice(0, 4) === String(state.activityYear);
      const activity = inYear ? activityForDate(date) : { focusMinutes: 0, completedSessions: 0, taskCount: 0, level: 0 };
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = `activity-cell level-${activity.level}${date === state.activitySelectedDate ? " selected" : ""}`;
      cell.dataset.activityDate = date;
      cell.disabled = !inYear;
      cell.setAttribute("aria-label", `${formatCalendarDate(date, true)}: ${activity.focusMinutes} Focus minutes, ${activity.completedSessions} completed sessions, ${activity.taskCount} tasks completed`);
      cell.title = `${formatCalendarDate(date, true)} · ${activity.focusMinutes} Focus minutes · ${activity.completedSessions} sessions · ${activity.taskCount} tasks`;
      if (inYear) {
        yearMinutes += activity.focusMinutes;
        yearTasks += activity.taskCount;
        if (activity.level > 0) activeDays += 1;
      }
      cell.addEventListener("click", () => {
        state.activitySelectedDate = date;
        renderActivityCalendar();
        renderActivityDetail(date);
      });
      grid.append(cell);
    }
    weeks.append(weekdayLabels, grid);
    calendar.append(months, weeks);
    $("#activity-year-summary").textContent = `${activeDays} active days · ${yearMinutes} Focus min · ${yearTasks} tasks`;
    $("#activity-detail").hidden = false;
    renderActivityDetail(state.activitySelectedDate);
  }

  function renderOverview() {
    const today = localDate();
    const goal = dailyTarget(today);
    const minutes = focusMinutesForDate(today);
    const habits = state.data.habits;
    const completedHabits = habits.filter((habit) => habit.completions.includes(today)).length;
    const streak = streakStats();
    const level = Math.floor(totalXp() / 100) + 1;
    $("#overview-streak").innerHTML = `${streak.current} <small>ngày</small>`;
    $("#overview-streak-foot").textContent = streak.current ? `Kỷ lục cá nhân: ${streak.best} ngày` : "Đạt mục tiêu Focus mỗi ngày";
    $("#overview-focus").innerHTML = `${Math.floor(minutes)} <small>phút</small>`;
    $("#overview-focus-foot").textContent = `Mục tiêu ${goal} phút · ${goalMet(today) ? "đã đạt" : `${Math.max(0, Math.ceil(goal - minutes))} phút còn lại`}`;
    $("#overview-habits").innerHTML = `${completedHabits} <small>/ ${habits.length}</small>`;
    const disciplineTotal = habits.length + 1;
    const disciplineDone = (goalMet(today) ? 1 : 0) + completedHabits;
    $("#overview-discipline").innerHTML = `${disciplineTotal ? Math.floor(disciplineDone / disciplineTotal * 100) : 0} <small>%</small>`;
    $("#overview-xp").textContent = `${totalXp()} XP · Level ${level}`;
    $("#overview-default-duration").innerHTML = `${state.data.settings.defaultDurationMinutes} <small>phút</small>`;
    const week = $("#overview-week");
    week.replaceChildren();
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = shiftDate(today, -offset);
      const item = document.createElement("span");
      item.className = goalMet(date) ? "day-achieved" : date === today ? "day-current" : "day-missed";
      addClass(item, "", DAY_NAMES[dateFromKey(date).getDay()]);
      const mark = document.createElement("b");
      mark.textContent = goalMet(date) ? "✓" : "·";
      item.append(mark);
      week.append(item);
    }
    $("#streak-caption").textContent = `Streak hiện tại ${streak.current} ngày · kỷ lục ${streak.best} ngày.`;
    renderOverviewChart();
    renderOverviewHabits();
  }

  function renderOverviewChart() {
    const container = $("#overview-chart");
    const today = localDate();
    const values = Array.from({ length: 7 }, (_, index) => {
      const date = shiftDate(today, index - 6);
      return { date, minutes: focusMinutesForDate(date) };
    });
    const maximum = Math.max(...values.map((item) => item.minutes), 0);
    if (!maximum) {
      container.className = "chart-empty";
      container.innerHTML = '<span class="empty-chart-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V12m5 7V5m5 14v-9m5 9V3"/></svg></span><strong>Chưa có phiên Focus được ghi nhận</strong><span>Hoàn thành phiên Focus đầu tiên để bắt đầu theo dõi.</span>';
      return;
    }
    container.className = "focus-week-chart";
    container.replaceChildren();
    values.forEach(({ date, minutes }) => {
      const column = document.createElement("div");
      column.className = "focus-chart-column";
      const value = document.createElement("span");
      value.textContent = minutes ? `${Math.round(minutes)}` : "";
      const area = document.createElement("div");
      area.className = "focus-chart-area";
      const bar = document.createElement("i");
      bar.style.height = `${minutes ? Math.max(3, minutes / maximum * 84) : 0}px`;
      area.append(bar);
      const label = document.createElement("small");
      label.textContent = DAY_NAMES[dateFromKey(date).getDay()];
      column.append(value, area, label);
      container.append(column);
    });
  }

  function renderOverviewHabits() {
    const list = $("#overview-habits-list");
    const habits = state.data.habits;
    if (!habits.length) {
      list.className = "empty-habits";
      list.innerHTML = '<span class="habit-check" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="m4 10 4 4 8-8"/></svg></span><strong>Chưa có thói quen nào</strong><span>Tạo một thói quen nhỏ để bắt đầu xây dựng nhịp độ.</span><a href="#habits" data-page-link="habits" class="subtle-link">Đến mục Thói quen <span aria-hidden="true">→</span></a>';
      return;
    }
    list.className = "overview-habit-rows";
    list.replaceChildren();
    habits.slice(0, 4).forEach((habit) => {
      const row = document.createElement("div");
      row.className = "overview-habit-row";
      const icon = document.createElement("span");
      icon.className = "habit-mini-icon";
      icon.textContent = habit.icon;
      icon.style.color = habit.color;
      icon.style.borderColor = habit.color;
      const name = document.createElement("strong");
      name.textContent = habit.name;
      const status = document.createElement("span");
      status.className = habit.completions.includes(localDate()) ? "habit-status complete" : "habit-status";
      status.textContent = habit.completions.includes(localDate()) ? "Hoàn thành" : "Đang chờ";
      row.append(icon, name, status);
      list.append(row);
    });
  }

  function timerElapsed(now = Date.now()) {
    if (!state.timer) return 0;
    return state.timer.accumulatedMs + (state.timer.status === "running" ? Math.min(now, state.timer.phaseEndsAt) - state.timer.phaseStartedAt : 0);
  }

  function timerRemaining(now = Date.now()) {
    if (!state.timer) return 0;
    if (state.timer.status === "paused") return state.timer.remainingMs;
    if (state.timer.status === "pending-save") return 0;
    return Math.max(0, state.timer.phaseEndsAt - now);
  }

  function setFocusVisualizer(mode) {
    const panels = $$("[data-visual-panel]");
    if (!panels.some((panel) => panel.dataset.visualPanel === mode)) return;
    $("#timer-visual-stage").dataset.activeVisualizer = mode;
    $$("[data-visualizer]").forEach((button) => {
      const selected = button.dataset.visualizer === mode;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    panels.forEach((panel) => {
      const selected = panel.dataset.visualPanel === mode;
      panel.classList.toggle("is-active", selected);
      panel.setAttribute("aria-hidden", String(!selected));
      panel.inert = !selected;
    });
  }

  function updateFocusVisuals(progress, status) {
    const stage = $("#timer-visual-stage");
    const fraction = Math.max(0, Math.min(1, progress / 100));
    const remaining = 1 - fraction;
    stage.dataset.status = status;
    stage.style.setProperty("--focus-progress", `${progress}%`);
    stage.style.setProperty("--focus-remaining", String(remaining));

    const candleHeight = Math.round(28 + remaining * 44);
    const candleTop = 150 - candleHeight;
    $("#candle-wax").setAttribute("y", String(candleTop));
    $("#candle-wax").setAttribute("height", String(candleHeight));
    $("#candle-wax-highlight").setAttribute("y", String(candleTop));
    $("#candle-wax-highlight").setAttribute("height", String(candleHeight));
    $("#candle-wax-shadow").setAttribute("y", String(candleTop + 5));
    $("#candle-wax-shadow").setAttribute("height", String(candleHeight - 5));
    $("#candle-wax-top").setAttribute("y", String(candleTop - 6));
    $("#candle-wick").setAttribute("y", String(candleTop - 16));
    $("#candle-wick").setAttribute("height", "12");
    $("#candle-flame").setAttribute("transform", `translate(0 ${candleTop - 78})`);

    const sandHeight = Math.round(4 + fraction * 24);
    const sandWidth = Math.round(8 + fraction * 36);
    const sand = $("#hourglass-sand-base");
    sand.setAttribute("x", String(90 - sandWidth / 2));
    sand.setAttribute("y", String(134 - sandHeight));
    sand.setAttribute("width", String(sandWidth));
    sand.setAttribute("height", String(sandHeight));
  }

  function setTimerState(status, remainingMs) {
    const timer = state.timer;
    if (!timer) return;
    const audioReady = status === "running" && timer.status === "paused" && soundSettings.enabled
      ? prepareAudioContext()
      : null;
    const now = Date.now();
    if (status === "paused" && timer.status === "running") {
      stopTimerAlarm();
      timer.accumulatedMs += Math.max(0, Math.min(now, timer.phaseEndsAt) - timer.phaseStartedAt);
      timer.remainingMs = Math.max(0, timer.phaseEndsAt - now);
      timer.status = "paused";
    } else if (status === "running" && timer.status === "paused") {
      timer.status = "running";
      timer.phaseStartedAt = now;
      timer.phaseEndsAt = now + (remainingMs ?? timer.remainingMs);
      delete timer.remainingMs;
    }
    saveTimer();
    renderTimer();
    if (audioReady) void audioReady.then((context) => { if (context) scheduleTimerAlarm(); });
  }

  async function startFocus(event) {
    event.preventDefault();
    const form = $("#focus-form");
    if (!form.reportValidity()) return;
    if (state.timer) {
      showToast("Đã có một phiên Focus đang hoạt động.", true);
      return;
    }
    const task = $("#focus-task").value.trim();
    const choice = $('input[name="focus-duration"]:checked').value;
    const minutes = choice === "custom" ? Number($("#custom-duration").value) : Number(choice);
    if (!task || !Number.isInteger(minutes) || minutes < 1 || minutes > 180) {
      showToast("Nhập nhiệm vụ và thời lượng từ 1 đến 180 phút.", true);
      return;
    }
    const audioReady = soundSettings.enabled ? prepareAudioContext() : Promise.resolve(null);
    const now = Date.now();
    state.timer = {
      id: newId(),
      task,
      expectedMinutes: minutes,
      status: "running",
      accumulatedMs: 0,
      startedAt: new Date(now).toISOString(),
      phaseStartedAt: now,
      phaseEndsAt: now + minutes * 60000
    };
    if (!saveTimer()) {
      state.timer = null;
      renderTimer();
      return;
    }
    const context = await audioReady;
    if (context) scheduleTimerAlarm();
    renderTimer();
    showToast("Đã bắt đầu phiên Focus. Hãy dành sự chú ý cho nhiệm vụ này.");
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch((error) => showToast(`Không thể bật thông báo: ${error instanceof Error ? error.message : String(error)}`, true));
    }
  }

  function completeTimer() {
    if (!state.timer || state.timer.status === "pending-save") return;
    const timer = state.timer;
    timer.accumulatedMs += Math.max(0, timer.phaseEndsAt - timer.phaseStartedAt);
    timer.status = "pending-save";
    timer.actualMs = Math.min(timer.accumulatedMs, timer.expectedMinutes * 60000);
    timer.endedAt = new Date(timer.phaseEndsAt).toISOString();
    timer.completionType = "completed";
    saveTimer();
    renderTimer();
    notifyFocusComplete();
    openConfirm({
      title: "Phiên Focus đã hoàn thành",
      message: `Bạn đã tập trung "${timer.task}" trong ${formatMinutes(timer.actualMs)}. Lưu phiên vào lịch sử?`,
      accept: "Lưu phiên",
      cancel: "Bỏ phiên",
      onAccept: savePendingSession,
      onCancel: discardPendingSession
    });
  }

  function notifyFocusComplete() {
    showToast("Hoàn thành phiên Focus. Hãy ghi nhận kết quả.");
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification("FocusForge", { body: `Bạn đã hoàn thành: ${state.timer.task}` });
      } catch (error) {
        showToast(`Phiên đã hoàn thành nhưng không thể hiển thị thông báo: ${error instanceof Error ? error.message : String(error)}`, true);
      }
    }
  }

  function endFocusEarly() {
    if (!state.timer || state.timer.status === "pending-save") return;
    const timer = state.timer;
    openConfirm({
      title: "Kết thúc phiên sớm?",
      message: `Thời gian Focus thực tế là ${formatMinutes(timerElapsed())}. Bạn có thể lưu phiên này vào lịch sử; phiên dưới 15 phút không tính vào streak, XP hay thành tích.`,
      accept: "Kết thúc & lưu",
      cancel: timer.status === "paused" ? "Tiếp tục phiên" : "Tiếp tục Focus",
      onCancel: () => {
        if (timer.status === "paused") setTimerState("running");
        else if (timer.status === "running") void refreshTimerAlarm();
      },
      onAccept: () => {
        stopTimerAlarm();
        const now = Date.now();
        timer.actualMs = Math.max(0, Math.floor(timerElapsed(now)));
        timer.endedAt = new Date(now).toISOString();
        timer.status = "pending-save";
        timer.completionType = "interrupted";
        saveTimer();
        savePendingSession();
      }
    });
  }

  function savePendingSession() {
    if (!state.timer || state.timer.status !== "pending-save") return;
    stopAllAlarms();
    const timer = state.timer;
    if (state.data.focusSessions.some((session) => session.id === timer.id)) {
      state.timer = null;
      saveTimer();
      renderAll();
      showToast("Phiên Focus này đã được lưu trước đó; không ghi trùng.");
      return;
    }
    const valid = timer.actualMs >= MIN_FOCUS_MINUTES * 60000;
    const session = {
      id: timer.id,
      task: timer.task,
      expectedMinutes: timer.expectedMinutes,
      actualMs: Math.max(0, timer.actualMs),
      startedAt: timer.startedAt,
      endedAt: timer.endedAt,
      status: timer.completionType === "completed" ? "completed" : "interrupted",
      valid
    };
    state.data.focusSessions.push(session);
    const startDay = localDate(new Date(session.startedAt));
    if (!Object.hasOwn(state.data.dailyTargets, startDay)) state.data.dailyTargets[startDay] = state.data.settings.dailyGoalMinutes;
    const stored = saveData();
    if (!stored) {
      state.data.focusSessions.pop();
      return;
    }
    reconcileXp();
    saveData();
    showToast(valid ? "Đã lưu phiên Focus. XP và tiến độ đã được cập nhật." : "Đã lưu phiên ngắn vào lịch sử; phiên chưa đạt ngưỡng hợp lệ 15 phút.");
    state.timer = null;
    saveTimer();
    $("#focus-form").reset();
    applyDefaultDurationChoice();
    renderAll();
  }

  function discardPendingSession() {
    stopAllAlarms();
    state.timer = null;
    saveTimer();
    renderAll();
    showToast("Phiên Focus không được lưu.");
  }

  function renderTimer() {
    const timer = state.timer;
    const setup = $("#timer-setup");
    const stateLabel = $("#timer-state");
    const stateDot = $("#timer-state-dot");
    const primary = $("#timer-main-action");
    const controls = $("#timer-controls");
    setup.hidden = Boolean(timer);

    if (!timer) {
      const choice = $('input[name="focus-duration"]:checked')?.value || String(state.data.settings.defaultDurationMinutes);
      const shownMinutes = choice === "custom" ? Number($("#custom-duration").value) || state.data.settings.defaultDurationMinutes : Number(choice);
      $("#custom-duration-wrap").hidden = choice !== "custom";
      stateLabel.textContent = "SẴN SÀNG";
      stateDot.className = "timer-state-dot";
      $("#timer-task-label").textContent = "CHỌN NHIỆM VỤ";
      $$(".timer-display").forEach((display) => { display.textContent = `${String(shownMinutes).padStart(2, "0")}:00`; });
      $$(".timer-progress-label").forEach((label) => { label.textContent = "0% hoàn thành"; });
      $("#timer-task").textContent = "Tập trung vào điều quan trọng nhất.";
      $("#timer-help").textContent = `Mục tiêu ngày ${state.data.settings.dailyGoalMinutes} phút · Phiên hợp lệ từ ${MIN_FOCUS_MINUTES} phút.`;
      $("#timer-progress").style.setProperty("--timer-progress", "0deg");
      updateFocusVisuals(0, "idle");
      controls.replaceChildren();
      primary.disabled = true;
      primary.hidden = true;
      primary.textContent = "Bắt đầu";
      controls.append(primary);
      return;
    }

    $("#timer-task-label").textContent = timer.task.toLocaleUpperCase("vi").slice(0, 28);
    $("#timer-task").textContent = timer.task;
    const remaining = timerRemaining();
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor(remaining % 60000 / 1000);
    const displayText = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    $$(".timer-display").forEach((display) => { display.textContent = displayText; });
    const percent = timer.status === "pending-save" ? 100 : Math.min(100, timerElapsed() / (timer.expectedMinutes * 60000) * 100);
    $("#timer-progress").style.setProperty("--timer-progress", `${percent * 3.6}deg`);
    $$(".timer-progress-label").forEach((label) => { label.textContent = `${Math.floor(percent)}% hoàn thành`; });
    updateFocusVisuals(percent, timer.status);
    $("#timer-help").textContent = timer.status === "pending-save"
      ? `Thời gian thực tế: ${formatMinutes(timer.actualMs)} · Xác nhận lưu để ghi nhận.`
      : timer.status === "paused" ? "Đồng hồ đã tạm dừng; thời gian tạm dừng không được tính."
        : `Đã tập trung ${formatMinutes(timerElapsed())} · Dự kiến ${timer.expectedMinutes} phút`;
    stateLabel.textContent = timer.status === "running" ? "ĐANG TẬP TRUNG" : timer.status === "paused" ? "ĐÃ TẠM DỪNG" : "CHỜ XÁC NHẬN";
    stateDot.className = `timer-state-dot ${timer.status}`;
    controls.replaceChildren();
    primary.hidden = false;
    if (timer.status === "pending-save") {
      primary.disabled = false;
      primary.textContent = "Lưu phiên";
      primary.onclick = savePendingSession;
      const discard = document.createElement("button");
      discard.type = "button";
      discard.className = "button button-outline";
      discard.textContent = "Bỏ phiên";
      discard.addEventListener("click", () => openConfirm({
        title: "Bỏ phiên Focus?",
        message: "Phiên này sẽ không được thêm vào lịch sử và sẽ không nhận XP.",
        accept: "Bỏ phiên",
        onAccept: discardPendingSession
      }));
      controls.append(primary, discard);
    } else {
      primary.disabled = false;
      primary.className = "button button-primary";
      primary.textContent = timer.status === "running" ? "Tạm dừng" : "Tiếp tục";
      primary.onclick = () => {
        if (timer.status === "running" && Date.now() >= timer.phaseEndsAt) completeTimer();
        else setTimerState(timer.status === "running" ? "paused" : "running");
      };
      const end = document.createElement("button");
      end.type = "button";
      end.className = "button button-outline";
      end.textContent = "Kết thúc sớm";
      end.addEventListener("click", endFocusEarly);
      controls.append(primary, end);
    }
  }

  function updateDurationChoice() {
    const custom = $('input[name="focus-duration"]:checked')?.value === "custom";
    $("#custom-duration-wrap").hidden = !custom;
    if (!state.timer) renderTimer();
  }

  function applyDefaultDurationChoice() {
    const minutes = state.data.settings.defaultDurationMinutes;
    const value = minutes === 25 || minutes === 50 ? String(minutes) : "custom";
    const radio = $(`input[name="focus-duration"][value="${value}"]`);
    if (radio) radio.checked = true;
    $("#custom-duration").value = String(minutes);
    $("#custom-duration-wrap").hidden = value !== "custom";
  }

  function renderFocusHistory() {
    const list = $("#focus-history");
    const sessions = [...state.data.focusSessions].sort((a, b) => Date.parse(b.endedAt) - Date.parse(a.endedAt));
    $("#focus-session-count").textContent = `${sessions.length} ${sessions.length === 1 ? "phiên" : "phiên"}`;
    if (!sessions.length) {
      list.className = "history-list empty-list";
      list.textContent = "Chưa có phiên Focus. Lịch sử sẽ xuất hiện sau khi bạn lưu phiên đầu tiên.";
      return;
    }
    list.className = "history-list";
    list.replaceChildren();
    sessions.slice(0, 8).forEach((session) => {
      const row = document.createElement("div");
      row.className = "history-row";
      const detail = document.createElement("div");
      detail.className = "history-detail";
      const title = document.createElement("strong");
      title.textContent = session.task;
      const meta = document.createElement("small");
      meta.textContent = `${formatDateTime(session.startedAt)} · ${session.status === "completed" ? "Hoàn thành" : "Kết thúc sớm"}`;
      detail.append(title, meta);
      const duration = document.createElement("span");
      duration.textContent = formatMinutes(session.actualMs);
      const valid = document.createElement("span");
      valid.className = session.valid ? "session-badge valid" : "session-badge";
      valid.textContent = session.valid ? "Hợp lệ" : "Dưới 15 phút";
      row.append(detail, duration, valid);
      list.append(row);
    });
  }

  function renderHabits() {
    const today = localDate();
    const list = $("#habit-list");
    $("#habit-progress-label").textContent = `${state.data.habits.filter((habit) => habit.completions.includes(today)).length} / ${state.data.habits.length}`;
    if (!state.data.habits.length) {
      list.className = "habit-list empty-list";
      list.textContent = "Chưa có thói quen. Tạo thói quen đầu tiên bằng biểu mẫu bên cạnh.";
      return;
    }
    list.className = "habit-list";
    list.replaceChildren();
    state.data.habits.forEach((habit) => {
      const done = habit.completions.includes(today);
      const row = document.createElement("article");
      row.className = `habit-item ${done ? "is-done" : ""}`;
      const mark = document.createElement("button");
      mark.type = "button";
      mark.className = "habit-complete";
      mark.dataset.habitToggle = habit.id;
      mark.setAttribute("aria-label", done ? `Bỏ hoàn thành ${habit.name}` : `Hoàn thành ${habit.name}`);
      mark.setAttribute("aria-pressed", String(done));
      mark.textContent = done ? "✓" : "";
      const identity = document.createElement("span");
      identity.className = "habit-item-icon";
      identity.textContent = habit.icon;
      identity.style.color = habit.color;
      identity.style.borderColor = habit.color;
      const name = document.createElement("div");
      name.className = "habit-item-name";
      const title = document.createElement("strong");
      title.textContent = habit.name;
      const subtitle = document.createElement("small");
      subtitle.textContent = done ? "Hoàn thành hôm nay · +5 XP" : "Một lần mỗi ngày · +5 XP";
      const history = document.createElement("span");
      history.className = "habit-history";
      for (let offset = 6; offset >= 0; offset -= 1) {
        const date = shiftDate(today, -offset);
        const day = document.createElement("span");
        const completed = habit.completions.includes(date);
        day.className = completed ? "history-day done" : "history-day";
        day.textContent = DAY_NAMES[dateFromKey(date).getDay()];
        day.title = `${formatLongDate(date)}${completed ? " · Hoàn thành" : ""}`;
        day.setAttribute("aria-label", day.title);
        history.append(day);
      }
      name.append(title, subtitle, history);
      const actions = document.createElement("div");
      actions.className = "habit-actions";
      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "small-action";
      edit.textContent = "Sửa";
      edit.dataset.habitEdit = habit.id;
      edit.setAttribute("aria-label", `Sửa ${habit.name}`);
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "small-action danger-text";
      remove.textContent = "Xóa";
      remove.dataset.habitDelete = habit.id;
      remove.setAttribute("aria-label", `Xóa ${habit.name}`);
      actions.append(edit, remove);
      row.append(mark, identity, name, actions);
      list.append(row);
    });
  }

  function renderStreak() {
    const stats = streakStats();
    $("#streak-current").textContent = `${stats.current} ${stats.current === 1 ? "ngày liên tiếp" : "ngày liên tiếp"}`;
    $("#streak-best").textContent = `Kỷ lục: ${stats.best} ngày`;
    const today = localDate();
    const week = $("#habit-week");
    week.replaceChildren();
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = shiftDate(today, -offset);
      const item = document.createElement("span");
      item.className = stats.achieved.has(date) ? "day-achieved" : date === today ? "day-current" : "day-missed";
      addClass(item, "", DAY_NAMES[dateFromKey(date).getDay()]);
      const mark = document.createElement("b");
      mark.textContent = stats.achieved.has(date) ? "✓" : "·";
      item.append(mark);
      week.append(item);
    }
    $("#streak-message").textContent = goalMet(today)
      ? `Mục tiêu hôm nay đã đạt (${Math.floor(focusMinutesForDate(today))}/${dailyTarget(today)} phút).`
      : `Mục tiêu hôm nay: ${dailyTarget(today)} phút Focus hợp lệ. Đã tích lũy ${Math.floor(focusMinutesForDate(today))} phút.`;
  }

  function renderStatistics() {
    const validSessions = state.data.focusSessions.filter((session) => session.valid);
    const total = validFocusMs();
    const avg = validSessions.length ? total / validSessions.length / 60000 : 0;
    let planned = 0;
    let completed = 0;
    const today = localDate();
    const weekly = [];
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = shiftDate(today, -offset);
      const minutes = focusMinutesForDate(date);
      const sessions = validSessions.filter((session) => localDate(new Date(session.endedAt)) === date).length;
      const activeHabits = state.data.habits.filter((habit) => localDate(new Date(habit.createdAt)) <= date);
      const done = activeHabits.filter((habit) => habit.completions.includes(date)).length;
      planned += activeHabits.length;
      completed += done;
      weekly.push({ date, minutes, sessions, done, planned: activeHabits.length, goal: goalMet(date) });
    }
    $("#analytics-valid-count").textContent = String(validSessions.length);
    $("#analytics-completed-tasks").textContent = String(state.data.tasks.filter((task) => task.done).length);
    $("#analytics-total-time").innerHTML = `${Math.floor(total / 60000)} <small>phút</small>`;
    $("#analytics-average").innerHTML = `${avg.toFixed(1).replace(".", ",")} <small>phút</small>`;
    $("#analytics-habit-rate").innerHTML = `${planned ? Math.round(completed / planned * 100) : "—"} <small>%</small>`;
    const streak = streakStats();
    $("#statistics-streak").textContent = `Streak ${streak.current} · Kỷ lục ${streak.best}`;
    const chart = $("#statistics-chart");
    if (!total) {
      chart.className = "statistics-chart chart-no-data";
      chart.textContent = "Chưa có phiên Focus hợp lệ trong dữ liệu.";
    } else {
      chart.className = "statistics-chart";
      chart.replaceChildren();
      const max = Math.max(...weekly.map((item) => item.minutes), 1);
      weekly.forEach(({ date, minutes }) => {
        const column = document.createElement("div");
        column.className = "statistics-column";
        const amount = document.createElement("span");
        amount.textContent = minutes ? `${Math.round(minutes)}m` : "";
        const barArea = document.createElement("div");
        barArea.className = "statistics-bar-area";
        const bar = document.createElement("i");
        bar.style.height = `${minutes ? Math.max(4, minutes / max * 115) : 0}px`;
        barArea.append(bar);
        const label = document.createElement("small");
        label.textContent = DAY_NAMES[dateFromKey(date).getDay()];
        column.append(amount, barArea, label);
        chart.append(column);
      });
    }
    const body = $("#statistics-table");
    body.replaceChildren();
    weekly.slice().reverse().forEach((item) => {
      const row = document.createElement("tr");
      [formatLongDate(item.date), `${Math.floor(item.minutes)} phút`, String(item.sessions), `${item.done} / ${item.planned}`, item.goal ? "Đạt" : "Chưa đạt"].forEach((value, index) => {
        const cell = document.createElement("td");
        cell.textContent = value;
        if (index === 4) cell.className = item.goal ? "goal-cell achieved" : "goal-cell";
        row.append(cell);
      });
      body.append(row);
    });
  }

  function renderAchievements() {
    const xp = totalXp();
    const level = Math.floor(xp / 100) + 1;
    const intoLevel = xp % 100;
    $("#level-value").textContent = `Level ${level}`;
    $("#xp-total").textContent = `${xp} XP`;
    $("#achievement-xp").textContent = `${xp} XP`;
    $("#level-progress").style.width = `${intoLevel}%`;
    $("#level-next").textContent = `${intoLevel} / 100 XP đến Level ${level + 1}`;
    const unlocked = new Map(state.data.achievements.map((item) => [item.id, item]));
    $("#achievement-count").textContent = `${unlocked.size} / ${ACHIEVEMENTS.length} đã mở khóa`;
    const list = $("#achievement-list");
    list.replaceChildren();
    ACHIEVEMENTS.forEach((achievement) => {
      const achieved = unlocked.has(achievement.id);
      const card = document.createElement("article");
      card.className = `achievement-item ${achieved ? "unlocked" : "locked"}`;
      const mark = document.createElement("span");
      mark.className = "achievement-icon";
      mark.textContent = achievement.icon;
      const copy = document.createElement("div");
      copy.className = "achievement-copy";
      const title = document.createElement("strong");
      title.textContent = achievement.title;
      const description = document.createElement("small");
      description.textContent = achievement.description;
      copy.append(title, description);
      const status = document.createElement("span");
      status.className = "achievement-status";
      status.textContent = achieved ? `Mở khóa ${formatDateTime(unlocked.get(achievement.id).unlockedAt)}` : "Chưa mở khóa";
      card.append(mark, copy, status);
      list.append(card);
    });
  }

  function getSelectedMethod() {
    if (!state.data) return METHODS[0];
    return METHODS.find((method) => method.id === state.data.selectedMethodId) || METHODS[0];
  }

  function fillExploreDetail(method) {
    const name = $("#explore-method-name");
    const summary = $("#explore-method-summary");
    const group = $("#explore-method-group");
    const duration = $("#explore-method-duration");
    const principle = $("#explore-principle");
    const evidence = $("#explore-evidence");
    const usage = $("#explore-usage");
    const limitations = $("#explore-limitations");
    const steps = $("#explore-steps");
    const example = $("#explore-example");
    const mistakes = $("#explore-mistakes");
    const combine = $("#explore-combine");
    if (!method || !name || !summary || !group || !duration || !principle || !evidence || !usage || !limitations || !steps || !example || !mistakes || !combine) return;
    name.textContent = method.name;
    summary.textContent = method.summary;
    group.textContent = method.group;
    duration.textContent = method.duration;
    principle.textContent = method.principle;
    evidence.textContent = method.evidence;
    usage.textContent = method.whenUse;
    limitations.textContent = method.avoid;
    steps.innerHTML = method.steps.map((step) => `<li>${step}</li>`).join("");
    example.textContent = method.example;
    mistakes.innerHTML = method.mistakes.map((step) => `<li>${step}</li>`).join("");
    combine.textContent = method.combine;
    const applyButton = $("#apply-method-btn");
    if (applyButton) applyButton.textContent = `Thực hiện ${method.name}`;
  }

  function renderExplore() {
    const list = $("#explore-method-list");
    if (!list) return;
    const query = ($("#explore-search")?.value || "").trim().toLowerCase();
    const filter = document.querySelector(".filter-btn.active")?.dataset.filter || "all";
    const filteredMethods = METHODS.filter((method) => {
      const matchFilter = filter === "all" || method.group === filter;
      const haystack = `${method.name} ${method.summary} ${method.group}`.toLowerCase();
      const matchQuery = !query || haystack.includes(query);
      return matchFilter && matchQuery;
    });
    list.replaceChildren();

    if (!filteredMethods.length) {
      const empty = document.createElement("div");
      empty.className = "task-empty";
      empty.textContent = "Không có phương pháp nào phù hợp với bộ lọc hiện tại.";
      list.append(empty);
      fillExploreDetail(METHODS[0]);
      return;
    }

    filteredMethods.forEach((method) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = `method-card ${state.data?.selectedMethodId === method.id ? "selected" : ""}`;
      item.dataset.methodId = method.id;
      item.innerHTML = `<strong>${method.name}</strong><small>${method.summary}</small><span class="method-card-meta"><span>${method.group}</span><span>${method.duration}</span></span>`;
      item.addEventListener("click", () => {
        if (!state.data) return;
        state.data.selectedMethodId = method.id;
        saveData();
        renderExplore();
      });
      list.append(item);
    });

    const selectedMethod = filteredMethods.find((method) => method.id === state.data?.selectedMethodId) || filteredMethods[0];
    if (state.data) state.data.selectedMethodId = selectedMethod.id;
    fillExploreDetail(selectedMethod);
  }

  function renderTasks() {
    const list = $("#task-list");
    const statusLabel = $("#task-progress-label");
    if (!list || !state.data) return;
    const tasks = [...state.data.tasks].sort((a, b) => Number(a.done) - Number(b.done) || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const remaining = tasks.filter((task) => !task.done).length;
    if (statusLabel) statusLabel.textContent = `${remaining} việc`;
    list.replaceChildren();
    if (!tasks.length) {
      const empty = document.createElement("div");
      empty.className = "task-empty";
      empty.textContent = "Chưa có việc nào. Hãy thêm một nhiệm vụ nhỏ để bắt đầu.";
      list.append(empty);
      return;
    }
    tasks.forEach((task) => {
      const item = document.createElement("div");
      item.className = `task-item ${task.done ? "done" : ""}`;
      const copy = document.createElement("div");
      copy.className = "task-copy";
      const title = document.createElement("strong");
      title.textContent = task.title;
      const meta = document.createElement("span");
      meta.textContent = task.priority === "high" ? "Ưu tiên cao" : task.priority === "low" ? "Ưu tiên thấp" : "Ưu tiên trung bình";
      copy.append(title, meta);
      const actions = document.createElement("div");
      actions.className = "task-actions";
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "task-toggle";
      toggle.textContent = task.done ? "Bỏ hoàn tất" : "Hoàn tất";
      toggle.dataset.taskToggle = task.id;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "task-delete";
      remove.textContent = "Xóa";
      remove.dataset.taskDelete = task.id;
      actions.append(toggle, remove);
      item.append(copy, actions);
      list.append(item);
    });
  }

  function applySelectedMethod() {
    const method = getSelectedMethod();
    if (!method) return;
    const taskInput = $("#focus-task");
    const taskMethodLabel = $("#focus-method-label");
    const note = $("#focus-method-note");
    const radioGroup = $$('input[name="focus-duration"]');
    if (taskInput) taskInput.value = method.name;
    if (taskMethodLabel) taskMethodLabel.textContent = method.name;
    if (note) note.hidden = false;
    if (radioGroup.length) {
      radioGroup.forEach((radio) => {
        radio.checked = Number(radio.value) === method.recommendedMinutes;
      });
      const customInput = $("#custom-duration");
      if (customInput) customInput.value = String(method.recommendedMinutes);
      $("#custom-duration-wrap").hidden = true;
    }
    state.data.selectedMethodId = method.id;
    saveData();
    navigate("focus");
    showToast(`Đã áp dụng phương pháp ${method.name}.`);
  }

  function renderAll() {
    renderOverview();
    renderActivityCalendar();
    renderTimer();
    renderFocusHistory();
    renderHabits();
    renderStreak();
    renderStatistics();
    renderAchievements();
    renderTasks();
    renderExplore();
    renderCalendarAndSchedules();
    renderThemes();
    renderSoundSettings();
    $("#daily-goal").value = state.data.settings.dailyGoalMinutes;
    $("#default-duration").value = state.data.settings.defaultDurationMinutes;
  }

  function navigate(pageName) {
    if (!Object.hasOwn(PAGE_NAMES, pageName)) return;
    const pages = $$(".page");
    const nextPage = $(`#page-${pageName}`);
    if (!nextPage) return;

    window.clearTimeout(state.navigationTimeout);
    if (state.navigationFrame) window.cancelAnimationFrame(state.navigationFrame);

    const currentPage = state.activePage
      ? $(`#page-${state.activePage}`)
      : pages.find((page) => page.classList.contains("active") && !page.hidden);
    pages.forEach((page) => {
      const keepVisible = page === currentPage || page === nextPage;
      page.classList.remove("is-leaving", "is-entering", "is-visible");
      page.hidden = !keepVisible;
      page.classList.toggle("active", keepVisible);
    });
    state.activePage = pageName;

    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!currentPage || currentPage === nextPage || reducedMotion) {
      pages.forEach((page) => {
        const active = page === nextPage;
        page.hidden = !active;
        page.classList.toggle("active", active);
      });
    } else {
      nextPage.classList.add("is-entering");
      currentPage.classList.add("is-leaving");
      void nextPage.offsetWidth;
      state.navigationFrame = window.requestAnimationFrame(() => {
        if (state.activePage !== pageName) return;
        nextPage.classList.add("is-visible");
      });
      state.navigationTimeout = window.setTimeout(() => {
        if (state.activePage !== pageName) return;
        pages.forEach((page) => {
          const active = page === nextPage;
          page.hidden = !active;
          page.classList.toggle("active", active);
          page.classList.remove("is-leaving", "is-entering", "is-visible");
        });
        state.navigationTimeout = 0;
        state.navigationFrame = 0;
      }, 260);
    }

    $$("[data-page-link]").forEach((link) => {
      const active = link.dataset.pageLink === pageName;
      link.classList.toggle("active", active);
      if (link.classList.contains("nav-link")) {
        if (active) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      }
    });
    $("#current-page-label").textContent = PAGE_NAMES[pageName];
    if (location.hash !== `#${pageName}`) history.replaceState(null, "", `#${pageName}`);
    $("#sidebar").classList.remove("open");
    $("#menu-toggle").setAttribute("aria-expanded", "false");
    $("#menu-toggle").setAttribute("aria-label", "Mở điều hướng");
  }

  function openConfirm({ title, message, accept = "Xác nhận", cancel = "Hủy", seriesLabel = "Delete Series", onAccept, onCancel, onSeries }) {
    state.confirmAction = { onAccept, onCancel, onSeries };
    $("#confirm-silence").hidden = !(state.timer?.status === "pending-save"
      && state.timer.completionType === "completed" && timerAlarmScheduled
      && audioContext && audioContext.currentTime < timerAlarmEndTime);
    $("#confirm-series-delete").hidden = true;
    $("#confirm-title").textContent = title;
    $("#confirm-message").textContent = message;
    $("#confirm-accept").textContent = accept;
    $("#confirm-cancel").textContent = cancel;
    $("#confirm-series-delete").textContent = seriesLabel;
    $("#confirm-modal").hidden = false;
    $("#confirm-cancel").focus();
  }

  function closeConfirm(accepted) {
    stopConfirmationAlarm();
    const action = state.confirmAction;
    state.confirmAction = null;
    $("#confirm-modal").hidden = true;
    $("#confirm-series-delete").hidden = true;
    if (accepted && action?.onAccept) action.onAccept();
    if (!accepted && action?.onCancel) action.onCancel();
  }

  function silenceTimerAlarm() {
    stopTimerAlarm();
    showToast("Đã tắt âm báo kết thúc phiên.");
  }

  function closeConfirmSeries() {
    stopConfirmationAlarm();
    const action = state.confirmAction;
    state.confirmAction = null;
    $("#confirm-modal").hidden = true;
    $("#confirm-series-delete").hidden = true;
    if (action?.onSeries) action.onSeries();
  }

  let ventBurnTimer = 0;
  let ventBurnInProgress = false;

  function resetVentSpace() {
    window.clearTimeout(ventBurnTimer);
    ventBurnTimer = 0;
    ventBurnInProgress = false;
    $("#vent-compose").hidden = false;
    $("#vent-thought-input").value = "";
    $("#vent-thought-input").disabled = false;
    $("#vent-burn-button").disabled = false;
    $("#vent-burn-stage").hidden = true;
    $("#vent-thought").textContent = "";
    $("#vent-thought").classList.remove("is-burning");
    $("#vent-paper-burning").classList.remove("is-burning");
    $("#vent-aftercare").hidden = true;
    $("#vent-positive-message").textContent = "";
  }

  function openVentSpace() {
    resetVentSpace();
    $("#vent-modal").hidden = false;
    $("#vent-thought-input").focus();
  }

  function closeVentSpace({ readyForFocus = false } = {}) {
    $("#vent-modal").hidden = true;
    resetVentSpace();
    if (readyForFocus) navigate("focus");
    else $("#vent-open-button").focus();
  }

  function burnVentThought() {
    if (ventBurnInProgress) return;
    const thought = $("#vent-thought-input").value.trim();
    if (!thought) {
      showToast("Hãy viết một suy nghĩ trước khi xóa tan.", true);
      $("#vent-thought-input").focus();
      return;
    }

    ventBurnInProgress = true;
    $("#vent-thought").textContent = thought;
    $("#vent-compose").hidden = true;
    $("#vent-burn-stage").hidden = false;
    $("#vent-burn-button").disabled = true;
    $("#vent-thought-input").value = "";
    requestAnimationFrame(() => $("#vent-paper-burning").classList.add("is-burning"));

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    ventBurnTimer = window.setTimeout(() => {
      $("#vent-thought").textContent = "";
      $("#vent-burn-stage").hidden = true;
      $("#vent-paper-burning").classList.remove("is-burning");
      $("#vent-positive-message").textContent = VENT_MESSAGES[Math.floor(Math.random() * VENT_MESSAGES.length)];
      $("#vent-aftercare").hidden = false;
      $("#vent-ready-button").focus();
      ventBurnInProgress = false;
      ventBurnTimer = 0;
    }, reducedMotion ? 20 : 1550);
  }

  function resetHabitForm() {
    state.editingHabitId = null;
    $("#habit-form").reset();
    $("#habit-form-title").textContent = "Tạo thói quen";
    $("#habit-form-kicker").textContent = "THÊM VÀO NHỊP ĐỘ";
    $("#habit-submit").textContent = "Thêm thói quen";
    $("#habit-cancel-edit").hidden = true;
  }

  function submitHabit(event) {
    event.preventDefault();
    if (!$("#habit-form").reportValidity()) return;
    const name = $("#habit-name").value.trim();
    if (!name) return;
    let oldValue = null;
    let createdHabit = null;
    if (state.editingHabitId) {
      const habit = state.data.habits.find((item) => item.id === state.editingHabitId);
      if (!habit) {
        showToast("Không tìm thấy thói quen cần sửa.", true);
        resetHabitForm();
        return;
      }
      oldValue = { name: habit.name, icon: habit.icon, color: habit.color };
      habit.name = name;
      habit.icon = $("#habit-icon").value;
      habit.color = $("#habit-color").value;
    } else {
      createdHabit = { id: newId(), name, icon: $("#habit-icon").value, color: $("#habit-color").value, createdAt: new Date().toISOString(), completions: [], earnedDates: [] };
      state.data.habits.push(createdHabit);
    }
    const saved = saveData();
    if (!saved) {
      if (createdHabit) state.data.habits = state.data.habits.filter((item) => item.id !== createdHabit.id);
      else {
        const habit = state.data.habits.find((item) => item.id === state.editingHabitId);
        if (habit && oldValue) Object.assign(habit, oldValue);
      }
      return;
    }
    reconcileXp();
    saveData();
    showToast(createdHabit ? "Đã thêm thói quen." : "Đã cập nhật thói quen; lịch sử hoàn thành vẫn được giữ.");
    resetHabitForm();
    renderAll();
  }

  function toggleHabit(id) {
    const habit = state.data.habits.find((item) => item.id === id);
    if (!habit) {
      showToast("Không tìm thấy thói quen.", true);
      return;
    }
    const today = localDate();
    const index = habit.completions.indexOf(today);
    if (index >= 0) {
      habit.completions.splice(index, 1);
      showToast("Đã bỏ đánh dấu. XP đã trao trước đó không bị cộng lại.");
    } else {
      habit.completions.push(today);
      habit.completions.sort();
      if (!habit.earnedDates.includes(today)) habit.earnedDates.push(today);
      showToast("Đã hoàn thành thói quen hôm nay · +5 XP.");
    }
    reconcileXp();
    saveData();
    renderAll();
  }

  function editHabit(id) {
    const habit = state.data.habits.find((item) => item.id === id);
    if (!habit) return showToast("Không tìm thấy thói quen cần sửa.", true);
    state.editingHabitId = id;
    $("#habit-name").value = habit.name;
    $("#habit-icon").value = habit.icon;
    $("#habit-color").value = habit.color;
    $("#habit-form-title").textContent = "Chỉnh sửa thói quen";
    $("#habit-form-kicker").textContent = "GIỮ NGUYÊN LỊCH SỬ";
    $("#habit-submit").textContent = "Lưu thay đổi";
    $("#habit-cancel-edit").hidden = false;
    $("#habit-name").focus();
  }

  function deleteHabit(id) {
    const habit = state.data.habits.find((item) => item.id === id);
    if (!habit) return showToast("Không tìm thấy thói quen cần xóa.", true);
    openConfirm({
      title: "Xóa thói quen?",
      message: `Xóa "${habit.name}" khỏi danh sách? Lịch sử XP đã ghi nhận sẽ không bị cộng lại.`,
      accept: "Xóa thói quen",
      onAccept: () => {
        const archived = state.data.habits.find((item) => item.id === id);
        state.data.habits = state.data.habits.filter((item) => item.id !== id);
        if (archived) state.data.habitArchive.push(archived);
        const saved = saveData();
        renderAll();
        if (saved) showToast("Đã xóa thói quen. Lịch sử XP được giữ trong kho lưu trữ.");
      }
    });
  }

  function saveSettings(event) {
    event.preventDefault();
    if (!$("#settings-form").reportValidity()) return;
    const dailyGoal = Number($("#daily-goal").value);
    const defaultDuration = Number($("#default-duration").value);
    if (!Number.isInteger(dailyGoal) || dailyGoal < 15 || dailyGoal > 600
      || !Number.isInteger(defaultDuration) || defaultDuration < 1 || defaultDuration > 180) {
      showToast("Mục tiêu phải từ 15 đến 600 phút; phiên mặc định từ 1 đến 180 phút.", true);
      return;
    }
    const previousSettings = { ...state.data.settings };
    state.data.settings.dailyGoalMinutes = dailyGoal;
    state.data.settings.defaultDurationMinutes = defaultDuration;
    if (!Object.hasOwn(state.data.dailyTargets, localDate())) state.data.dailyTargets[localDate()] = dailyGoal;
    if (!saveData()) {
      state.data.settings = previousSettings;
      renderAll();
      return;
    }
    reconcileXp();
    saveData();
    applyDefaultDurationChoice();
    renderAll();
    showToast("Đã lưu cài đặt. Mục tiêu ngày hiện tại đã được chốt từ đầu ngày.");
  }

  function exportData() {
    const exportObject = { ...state.data, exportFormat: "FocusForge", exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(exportObject, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `focusforge-backup-${localDate()}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("Đã xuất bản sao dữ liệu FocusForge.");
  }

  async function importData(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 2_000_000) return showToast("Tệp nhập vượt quá giới hạn 2 MB.", true);
    try {
      const parsed = JSON.parse(await file.text());
      if (parsed.exportFormat !== "FocusForge") throw new Error("Tệp không được nhận diện là bản sao FocusForge.");
      delete parsed.exportFormat;
      delete parsed.exportedAt;
      const issue = validateData(parsed);
      if (issue) throw new Error(issue);
      if (!Object.hasOwn(parsed.dailyTargets, localDate())) {
        parsed.dailyTargets[localDate()] = parsed.settings.dailyGoalMinutes;
      }
      openConfirm({
        title: "Thay thế dữ liệu hiện tại?",
        message: `Tệp đã vượt qua kiểm tra cấu trúc. Toàn bộ dữ liệu hiện tại${state.timer ? " và phiên Focus đang chạy" : ""} sẽ được thay bằng nội dung trong bản sao.`,
        accept: "Nhập và thay thế",
        onAccept: () => {
          const previous = state.data;
          const previousReadFailed = state.storageReadFailed;
          state.data = parsed;
          state.storageReadFailed = false;
          if (!saveData()) {
            state.data = previous;
            state.storageReadFailed = previousReadFailed;
            return;
          }
          state.timer = null;
          saveTimer();
          reconcileXp();
          saveData();
          applyDefaultDurationChoice();
          renderAll();
          showToast("Đã nhập dữ liệu FocusForge.");
        }
      });
    } catch (error) {
      showToast(`Không thể nhập dữ liệu: ${error.message}`, true);
    }
  }

  function clearAllData() {
    openConfirm({
      title: "Xóa toàn bộ dữ liệu?",
      message: `Toàn bộ phiên Focus, thói quen, XP, thành tích và cài đặt tùy chỉnh${state.timer ? " cùng phiên Focus đang chạy" : ""} sẽ bị xóa khỏi thiết bị này. Không thể hoàn tác.`,
      accept: "Xóa toàn bộ",
      onAccept: async () => {
        try {
          const user = state.user;
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(TIMER_KEY);
          localStorage.removeItem(CALENDAR_STORAGE_KEY);
          state.storageReadFailed = false;
          state.calendarReadFailed = false;
          state.data = createDefaultData();
          state.calendarSchedules = [];
          state.timer = null;
          saveData({ syncCloud: false });
          saveCalendarSchedules({ syncCloud: false });
          applyDefaultDurationChoice();
          renderAll();
          renderCalendarAndSchedules();
          const cloudCleared = await clearCloudFocusSessions(user);
          if (cloudCleared) showToast("Đã xóa dữ liệu FocusForge trên thiết bị và tài khoản đang đăng nhập.");
        } catch (error) {
          showToast(`Không thể xóa dữ liệu: ${error.message}`, true);
        }
      }
    });
  }

  function bindEvents() {
    document.addEventListener("pointerdown", () => {
      if (state.timer?.status === "running" && soundSettings.enabled && !timerAlarmScheduled) {
        void prepareAudioContext().then((context) => { if (context) scheduleTimerAlarm(); });
      }
    });
    $$("[data-page-link]").forEach((link) => link.addEventListener("click", (event) => {
      event.preventDefault();
      navigate(link.dataset.pageLink);
    }));
    $("#menu-toggle").addEventListener("click", () => {
      const open = $("#sidebar").classList.toggle("open");
      $("#menu-toggle").setAttribute("aria-expanded", String(open));
    });
    $("#auth-avatar-button").addEventListener("click", () => {
      if (!state.user) {
        openAuthModal();
        return;
      }
      const popover = $("#account-popover");
      const expanded = popover.hidden;
      popover.hidden = !expanded;
      $("#auth-avatar-button").setAttribute("aria-expanded", String(expanded));
    });
    $("#account-sign-in").addEventListener("click", openAuthModal);
    $("#account-sign-out").addEventListener("click", signOutCurrentUser);
    $("#auth-google").addEventListener("click", signInWithGoogle);
    $("#auth-form").addEventListener("submit", submitEmailAuth);
    $("#auth-mode-toggle").addEventListener("click", () => {
      const registering = $("#auth-form").dataset.mode !== "register";
      $("#auth-form").dataset.mode = registering ? "register" : "login";
      $("#auth-title").textContent = registering ? "Tạo tài khoản" : "Đăng nhập";
      $("#auth-submit").textContent = registering ? "Tạo tài khoản" : "Đăng nhập";
      $("#auth-password").autocomplete = registering ? "new-password" : "current-password";
      $("#auth-switch-label").textContent = registering ? "Đã có tài khoản?" : "Chưa có tài khoản?";
      $("#auth-mode-toggle").textContent = registering ? "Đăng nhập" : "Tạo tài khoản";
      setAuthError("");
    });
    $("#auth-close").addEventListener("click", closeAuthModal);
    $("#auth-modal").addEventListener("click", (event) => {
      if (event.target === $("#auth-modal")) closeAuthModal();
    });
    document.addEventListener("pointerdown", (event) => {
      if (!$("#account-menu").contains(event.target)) {
        $("#account-popover").hidden = true;
        $("#auth-avatar-button").setAttribute("aria-expanded", "false");
      }
    });
    window.addEventListener("hashchange", () => {
      const requested = location.hash.slice(1);
      navigate(Object.hasOwn(PAGE_NAMES, requested) ? requested : "overview");
    });
    $("#focus-form").addEventListener("submit", startFocus);
    $$("[data-visualizer]").forEach((button) => {
      button.addEventListener("click", () => setFocusVisualizer(button.dataset.visualizer));
    });
    $("#vent-open-button").addEventListener("click", openVentSpace);
    $("#vent-close").addEventListener("click", () => closeVentSpace());
    $("#vent-modal").addEventListener("click", (event) => {
      if (event.target === $("#vent-modal")) closeVentSpace();
    });
    $("#vent-thought-input").addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") burnVentThought();
    });
    $("#vent-burn-button").addEventListener("click", burnVentThought);
    $("#vent-ready-button").addEventListener("click", () => closeVentSpace({ readyForFocus: true }));
    $$('input[name="focus-duration"]').forEach((radio) => radio.addEventListener("change", updateDurationChoice));
    $("#task-form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const title = $("#task-title").value.trim();
      const priority = $("#task-priority").value;
      if (!title) return;
      state.data.tasks.push({
        id: newId(),
        title,
        priority,
        done: false,
        createdAt: new Date().toISOString()
      });
      saveData();
      $("#task-form").reset();
      $("#task-priority").value = "medium";
      renderTasks();
      showToast("Đã thêm việc mới vào danh sách.");
    });
    $("#task-list")?.addEventListener("click", (event) => {
      const toggleTarget = event.target.closest("[data-task-toggle]");
      const deleteTarget = event.target.closest("[data-task-delete]");
      if (toggleTarget) {
        const task = state.data.tasks.find((item) => item.id === toggleTarget.dataset.taskToggle);
        if (task) {
          const previousDone = task.done;
          const previousCompletedDate = task.completedDate;
          task.done = !task.done;
          if (task.done) task.completedDate = localDate();
          else delete task.completedDate;
          if (!saveData()) {
            task.done = previousDone;
            if (previousCompletedDate === undefined) delete task.completedDate;
            else task.completedDate = previousCompletedDate;
            return;
          }
          renderAll();
        }
      }
      if (deleteTarget) {
        const index = state.data.tasks.findIndex((item) => item.id === deleteTarget.dataset.taskDelete);
        if (index < 0) return;
        const [task] = state.data.tasks.splice(index, 1);
        if (!saveData()) {
          state.data.tasks.splice(index, 0, task);
          return;
        }
        renderAll();
      }
    });
    $("#explore-search")?.addEventListener("input", renderExplore);
    $$(".filter-btn").forEach((button) => button.addEventListener("click", () => {
      $$(".filter-btn").forEach((item) => item.classList.toggle("active", item === button));
      renderExplore();
    }));
    $("#apply-method-btn")?.addEventListener("click", applySelectedMethod);
    $("#activity-year").addEventListener("change", () => {
      const year = Number($("#activity-year").value);
      if (!Number.isInteger(year)) return;
      state.activityYear = year;
      state.activitySelectedDate = year === new Date().getFullYear() ? localDate() : `${year}-12-31`;
      renderActivityCalendar();
    });
    $("#calendar-prev").addEventListener("click", () => {
      const [year, month] = state.calendarDate.split("-").map(Number);
      const date = new Date(year, month - 2, 1, 12);
      state.calendarDate = localDate(date).slice(0, 7);
      renderCalendar();
    });
    $("#calendar-next").addEventListener("click", () => {
      const [year, month] = state.calendarDate.split("-").map(Number);
      const date = new Date(year, month, 1, 12);
      state.calendarDate = localDate(date).slice(0, 7);
      renderCalendar();
    });
    $("#calendar-today").addEventListener("click", () => {
      state.selectedCalendarDate = localDate();
      state.calendarDate = state.selectedCalendarDate.slice(0, 7);
      renderCalendarAndSchedules();
    });
    $("#schedule-add").addEventListener("click", () => openScheduleForm());
    $("#schedule-form").addEventListener("submit", submitSchedule);
    $("#schedule-cancel").addEventListener("click", closeScheduleForm);
    $("#schedule-close").addEventListener("click", closeScheduleForm);
    $("#schedule-modal").addEventListener("click", (event) => {
      if (event.target === $("#schedule-modal")) closeScheduleForm();
    });
    $("#schedule-repeat").addEventListener("change", () => {
      $("#schedule-weekdays").hidden = $("#schedule-repeat").value !== "weekdays";
    });
    $("#schedule-list").addEventListener("click", (event) => {
      const target = event.target.closest("[data-schedule-complete], [data-schedule-focus], [data-schedule-edit], [data-schedule-delete]");
      if (!target) return;
      const date = target.dataset.occurrenceDate;
      if (target.dataset.scheduleComplete) toggleScheduleCompletion(target.dataset.scheduleComplete, date);
      else if (target.dataset.scheduleFocus) startFocusFromSchedule(target.dataset.scheduleFocus, date);
      else if (target.dataset.scheduleEdit) openScheduleForm(date, target.dataset.scheduleEdit);
      else if (target.dataset.scheduleDelete) requestDeleteSchedule(target.dataset.scheduleDelete, date);
    });
    $("#habit-form").addEventListener("submit", submitHabit);
    $("#habit-cancel-edit").addEventListener("click", resetHabitForm);
    $("#habit-list").addEventListener("click", (event) => {
      const target = event.target.closest("[data-habit-toggle], [data-habit-edit], [data-habit-delete]");
      if (!target) return;
      if (target.dataset.habitToggle) toggleHabit(target.dataset.habitToggle);
      else if (target.dataset.habitEdit) editHabit(target.dataset.habitEdit);
      else if (target.dataset.habitDelete) deleteHabit(target.dataset.habitDelete);
    });
    $("#settings-form").addEventListener("submit", saveSettings);
    $("#sound-enabled").addEventListener("change", updateSoundSettings);
    $("#sound-type").addEventListener("change", updateSoundSettings);
    $("#sound-volume").addEventListener("input", updateSoundSettings);
    $("#sound-test").addEventListener("click", playSoundPreview);
    $("#theme-list").addEventListener("click", (event) => {
      const card = event.target.closest("[data-theme-id]");
      if (card) selectTheme(card.dataset.themeId);
    });
    $("#create-theme-toggle").addEventListener("click", () => {
      const form = $("#custom-theme-form");
      const expanded = form.hidden;
      form.hidden = !expanded;
      $("#create-theme-toggle").setAttribute("aria-expanded", String(expanded));
      if (expanded) $("#custom-theme-name").focus();
    });
    $("#custom-theme-cancel").addEventListener("click", () => {
      $("#custom-theme-form").reset();
      $("#custom-theme-form").hidden = true;
      $("#create-theme-toggle").setAttribute("aria-expanded", "false");
      $("#create-theme-toggle").focus();
    });
    $("#custom-theme-form").addEventListener("submit", createCustomTheme);
    $("#export-data").addEventListener("click", exportData);
    $("#import-data").addEventListener("change", importData);
    $("#clear-data").addEventListener("click", clearAllData);
    $("#confirm-accept").addEventListener("click", () => closeConfirm(true));
    $("#confirm-cancel").addEventListener("click", () => closeConfirm(false));
    $("#confirm-series-delete").addEventListener("click", closeConfirmSeries);
    $("#confirm-silence").addEventListener("click", silenceTimerAlarm);
    $("#confirm-modal").addEventListener("click", (event) => {
      if (event.target === $("#confirm-modal")) closeConfirm(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !$("#confirm-modal").hidden) closeConfirm(false);
      if (event.key === "Escape" && !$("#schedule-modal").hidden) closeScheduleForm();
      if (event.key === "Escape" && !$("#auth-modal").hidden) closeAuthModal();
      if (event.key === "Escape" && !$("#vent-modal").hidden) closeVentSpace();
    });
  }

  /* Local Lo-fi and YouTube music player */
  function initAudioWidget() {
    const settingsKey = "focusforge.audio.v1";
    const playlistKey = "focusforge.youtube.v1";
    const widget = $("#audio-widget");
    const popover = $("#audio-popover");
    const localMusic = new Map();
    const playerHosts = new Map();
    const badLocal = new Set();
    const badYoutube = new Set();
    let playlist = [];
    let musicPlayer = null;
    let musicPlayerReady = false;
    let musicVideoId = "";
    let musicPlaybackRequested = false;
    let youtubeApiPromise = null;
    let playing = null;
    let closeTimer = 0;
    let open = false;
    let settingsReadFailed = false;
    let playlistReadFailed = false;
    let mediaTitle = "";
    let mediaPlayback = "";
    const preferences = {
      source: "system", filter: "all", youtubeFilter: "all",
      localTrackId: LOCAL_TRACKS[0]?.id || "", youtubeTrackId: "", musicVolume: 0.65
    };
    let youtubeFilter = preferences.youtubeFilter;

    const validVolume = (value) => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
    const validCategory = (value) => ["chill", "coffee", "sleep", "study", "ambient"].includes(value);
    const fileProtocol = () => location.protocol === "file:";
    const make = (tag, cls, text) => {
      const el = document.createElement(tag);
      if (cls) el.className = cls;
      if (text !== undefined) el.textContent = text;
      return el;
    };
    const timeText = (seconds) => {
      if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
      const n = Math.floor(seconds);
      return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
    };
    const localTrack = (id) => LOCAL_TRACKS.find((item) => item.id === id);
    const youtubeTrack = (id) => playlist.find((item) => item.id === id);
    const saveSettings = () => {
      if (settingsReadFailed) {
        showToast("Không lưu được vì tùy chọn âm thanh cũ không đọc được; dữ liệu cũ được giữ nguyên.", true);
        return;
      }
      try { localStorage.setItem(settingsKey, JSON.stringify(preferences)); }
      catch (error) { showToast(`Không thể lưu tùy chọn âm thanh: ${error.message}`, true); }
    };
    const savePlaylist = () => {
      if (playlistReadFailed) {
        showToast("Không lưu được vì playlist YouTube cũ không đọc được; dữ liệu cũ được giữ nguyên.", true);
        return;
      }
      try { localStorage.setItem(playlistKey, JSON.stringify(playlist)); }
      catch (error) { showToast(`Không thể lưu danh sách YouTube: ${error.message}`, true); }
    };

    try {
      const raw = localStorage.getItem(settingsKey);
      if (raw) {
        const saved = JSON.parse(raw);
        if (!saved || typeof saved !== "object" || Array.isArray(saved)) throw new Error("Invalid audio settings");
        let invalid = false;
        if (["system", "youtube"].includes(saved.source)) preferences.source = saved.source;
        else if (saved.source !== undefined) invalid = true;
        if (["all", "chill", "coffee", "sleep", "study"].includes(saved.filter)) preferences.filter = saved.filter;
        else if (saved.filter !== undefined) invalid = true;
        if (["all", "chill", "coffee", "sleep", "study"].includes(saved.youtubeFilter)) preferences.youtubeFilter = saved.youtubeFilter;
        else if (saved.youtubeFilter !== undefined) invalid = true;
        if (LOCAL_TRACKS.some((item) => item.id === saved.localTrackId)) preferences.localTrackId = saved.localTrackId;
        else if (saved.localTrackId !== undefined) invalid = true;
        if (typeof saved.youtubeTrackId === "string" && saved.youtubeTrackId.length <= 100) preferences.youtubeTrackId = saved.youtubeTrackId;
        else if (saved.youtubeTrackId !== undefined) invalid = true;
        if (validVolume(saved.musicVolume)) preferences.musicVolume = saved.musicVolume;
        else if (saved.musicVolume !== undefined) invalid = true;
        if (invalid) showToast("Một số tùy chọn âm thanh không hợp lệ và đã được đặt lại.", true);
      }
    } catch (error) {
      settingsReadFailed = true;
      showToast(`Không thể đọc tùy chọn âm thanh: ${error.message}`, true);
    }
    try {
      const raw = localStorage.getItem(playlistKey);
      if (raw) {
        const saved = JSON.parse(raw);
        if (!Array.isArray(saved)) throw new Error("Playlist is not a list");
        const ids = new Set();
        playlist = saved.filter((item) => {
          const valid = item && typeof item === "object" && typeof item.videoId === "string" && /^[\w-]{11}$/.test(item.videoId)
            && item.id === `yt-${item.videoId}` && typeof item.title === "string" && item.title.length > 0 && item.title.length <= 200
            && validCategory(item.category) && !ids.has(item.videoId);
          if (valid) {
            ids.add(item.videoId);
            if (item.category === "ambient") item.category = "sleep";
          }
          return valid;
        });
        if (playlist.length !== saved.length) showToast("Một số mục YouTube không hợp lệ hoặc trùng đã được bỏ qua.", true);
      }
    } catch (error) {
      playlistReadFailed = true;
      showToast(`Không thể đọc danh sách YouTube: ${error.message}`, true);
    }
    if (!playlist.some((item) => item.id === preferences.youtubeTrackId)) {
      preferences.youtubeTrackId = playlist[0]?.id || "";
    }

    function extractYouTubeId(value) {
      const input = String(value || "").trim();
      if (/^[\w-]{11}$/.test(input)) return input;
      let url;
      try { url = new URL(input); } catch (error) { return ""; }
      const host = url.hostname.toLowerCase().replace(/^www\./, "");
      if (host === "youtu.be") return (url.pathname.split("/").filter(Boolean)[0] || "").match(/^[\w-]{11}$/)?.[0] || "";
      if (!["youtube.com", "m.youtube.com", "music.youtube.com"].includes(host)) return "";
      const watch = url.searchParams.get("v");
      if (watch && /^[\w-]{11}$/.test(watch)) return watch;
      return url.pathname.match(/^\/(?:embed|live|shorts)\/([\w-]{11})(?:\/|$)/)?.[1] || "";
    }

    function setOpen(value) {
      window.clearTimeout(closeTimer);
      if (open === value) return;
      open = value;
      $("#audio-widget-toggle").setAttribute("aria-expanded", String(value));
      $("#audio-widget-toggle").setAttribute("aria-label", `${value ? "Đóng" : "Mở"} trình phát nhạc`);
      if (value) {
        popover.hidden = false;
        requestAnimationFrame(() => popover.classList.add("is-open"));
      } else {
        popover.classList.remove("is-open");
        closeTimer = window.setTimeout(() => { if (!open) popover.hidden = true; }, 220);
      }
    }
    function placePopover() {
      if (popover.parentElement !== document.body) document.body.append(popover);
      const anchor = $("#audio-widget-toggle").getBoundingClientRect();
      if (window.innerWidth <= 720) {
        Object.assign(popover.style, { position: "fixed", top: "auto", right: "0", bottom: "0", left: "0", width: "100vw" });
      } else {
        Object.assign(popover.style, {
          position: "fixed",
          top: `${anchor.bottom + 12}px`,
          right: `${Math.max(0, window.innerWidth - anchor.right)}px`,
          bottom: "auto",
          left: "auto",
          width: ""
        });
      }
    }
    function updateHeader() {
      const localPlaying = [...localMusic.values()].some((audio) => !audio.paused && !audio.ended);
      widget.classList.toggle("is-playing", localPlaying || Boolean(playing?.source === "youtube" && musicPlayer?.getPlayerState?.() === window.YT?.PlayerState.PLAYING));
    }
    function getCurrentTrack() {
      if (playing) return playing.source === "system" ? localTrack(playing.id) : youtubeTrack(playing.id);
      return preferences.source === "system" ? localTrack(preferences.localTrackId) : youtubeTrack(preferences.youtubeTrackId);
    }
    function isMusicPlaying() {
      if (playing?.source === "system") {
        const audio = localMusic.get(playing.id);
        return Boolean(audio && !audio.paused && !audio.ended);
      }
      return Boolean(playing?.source === "youtube" && musicPlayer?.getPlayerState?.() === window.YT?.PlayerState.PLAYING);
    }
    function updateMini() {
      const track = getCurrentTrack();
      const audio = playing?.source === "system" ? localMusic.get(playing.id) : null;
      const duration = audio ? audio.duration : (musicPlayerReady && playing?.source === "youtube" ? musicPlayer.getDuration() : 0);
      const current = audio ? audio.currentTime : (musicPlayerReady && playing?.source === "youtube" ? musicPlayer.getCurrentTime() : 0);
      const isLive = Boolean(playing?.source === "youtube" && isMusicPlaying() && (!Number.isFinite(duration) || duration <= 0));
      $("#audio-mini-title").textContent = track?.title || "No track selected";
      $("#audio-mini-status").textContent = isMusicPlaying() ? "Playing" : "Paused";
      $("#audio-play").textContent = isMusicPlaying() ? "Ⅱ" : "▶";
      $("#audio-play").disabled = !track;
      $("#audio-prev").disabled = !track;
      $("#audio-next").disabled = !track;
      $("#audio-mini-seek-wrap").hidden = isLive || !Number.isFinite(duration) || duration <= 0;
      $("#audio-live-label").hidden = !isLive;
      if (duration > 0) {
        $("#audio-mini-seek").max = String(duration);
        $("#audio-mini-seek").value = String(Math.min(current || 0, duration));
      }
      $("#audio-mini-current").textContent = timeText(current);
      $("#audio-mini-duration").textContent = timeText(duration);
      if (track && track.title !== mediaTitle && "mediaSession" in navigator && "MediaMetadata" in window) {
        try {
          navigator.mediaSession.metadata = new MediaMetadata({ title: track.title, artist: track.artist || "FocusForge", album: "FocusForge" });
          mediaTitle = track.title;
        } catch (error) {
          showToast(`Không thể cập nhật thông tin media: ${error.message}`, true);
        }
      }
      if ("mediaSession" in navigator) {
        const playback = isMusicPlaying() ? "playing" : "paused";
        if (playback !== mediaPlayback) {
          try {
            navigator.mediaSession.playbackState = playback;
            mediaPlayback = playback;
          } catch (error) {
            if (error.name !== "NotSupportedError") showToast(`Không thể cập nhật trạng thái media: ${error.message}`, true);
            mediaPlayback = playback;
          }
        }
      }
      updateHeader();
    }
    function setSource(source) {
      preferences.source = source;
      document.querySelectorAll("[data-audio-source]").forEach((button) => {
        const selected = button.dataset.audioSource === source;
        button.classList.toggle("active", selected);
        button.setAttribute("aria-selected", String(selected));
        button.tabIndex = selected ? 0 : -1;
      });
      $("#audio-source-system").hidden = source !== "system";
      $("#audio-source-youtube").hidden = source !== "youtube";
      $("#audio-youtube-warning").hidden = source !== "youtube" || !fileProtocol();
      saveSettings();
      updateMini();
    }
    function stopOtherMusic(source, keepLocalId = null) {
      localMusic.forEach((audio, id) => {
        if (source !== "system" || id !== keepLocalId) audio.pause();
      });
      if (source !== "youtube" && musicPlayerReady) {
        musicPlayer.pauseVideo();
        updateHeader();
      }
    }
    function localNext(id, direction) {
      const tracks = preferences.filter === "all" ? LOCAL_TRACKS : LOCAL_TRACKS.filter((item) => item.category === preferences.filter);
      if (!tracks.length) return null;
      const foundIndex = tracks.findIndex((item) => item.id === id);
      const start = foundIndex < 0 ? (direction > 0 ? -1 : 0) : foundIndex;
      for (let i = 1; i <= tracks.length; i += 1) {
        const candidate = tracks[(start + direction * i + tracks.length * 2) % tracks.length];
        if (candidate && !badLocal.has(candidate.id)) return candidate;
      }
      return null;
    }
    function youtubeNext(id, direction) {
      const tracks = playlist.filter((item) => youtubeFilter === "all" || item.category === youtubeFilter);
      const start = tracks.findIndex((item) => item.id === id);
      for (let i = 1; i <= tracks.length; i += 1) {
        const candidate = tracks[(start + direction * i + tracks.length * 2) % tracks.length];
        if (candidate && !badYoutube.has(candidate.videoId)) return candidate;
      }
      return null;
    }
    function handleLocalError(track) {
      if (badLocal.has(track.id)) return;
      badLocal.add(track.id);
      localMusic.get(track.id)?.pause();
      showToast(`Không phát được “${track.title}”. Hãy thêm file ${track.src} hoặc kiểm tra định dạng MP3, OGG, WAV có được trình duyệt hỗ trợ không.`, true);
      renderLocalTracks();
      if (playing?.source === "system" && playing.id === track.id) {
        playing = null;
        updateMini();
      }
    }
    async function playLocal(id, direction = 1) {
      let track = localTrack(id);
      if (!track) return;
      if (badLocal.has(id)) track = localNext(id, direction);
      if (!track) return showToast("Không còn bài nhạc cục bộ khả dụng. Hãy thêm file vào thư mục music/ và cập nhật danh sách LOCAL_TRACKS.", true);
      const mimeTypes = { mp3: "audio/mpeg", ogg: "audio/ogg", wav: "audio/wav" };
      const extension = track.src.split(".").pop().toLowerCase();
      const probe = new Audio();
      if (!mimeTypes[extension] || !probe.canPlayType(mimeTypes[extension])) {
        badLocal.add(track.id);
        showToast(`Trình duyệt không hỗ trợ định dạng file của “${track.title}” (${extension || "không xác định"}). Dùng MP3, OGG hoặc WAV tương thích.`, true);
        renderLocalTracks();
        return;
      }
      musicPlaybackRequested = false;
      playing = { source: "system", id: track.id };
      stopOtherMusic("system", track.id);
      const audio = localMusic.get(track.id);
      preferences.source = "system";
      preferences.localTrackId = track.id;
      setSource("system");
      audio.volume = preferences.musicVolume;
      saveSettings();
      try { await audio.play(); }
      catch (error) { if (error.name !== "AbortError") handleLocalError(track); }
      renderLocalTracks();
      updateMini();
    }
    function ensureYoutubeApi() {
      if (fileProtocol()) return Promise.reject(new Error("Hãy mở bằng http://localhost để phát YouTube"));
      if (window.YT?.Player) return Promise.resolve(window.YT);
      if (youtubeApiPromise) return youtubeApiPromise;
      youtubeApiPromise = new Promise((resolve, reject) => {
        const oldCallback = window.onYouTubeIframeAPIReady;
        let done = false;
        const timer = window.setTimeout(() => { if (!done) { done = true; reject(new Error("Không tải được YouTube IFrame API.")); } }, 15000);
        window.onYouTubeIframeAPIReady = () => {
          if (typeof oldCallback === "function") oldCallback();
          if (done) return;
          done = true;
          clearTimeout(timer);
          resolve(window.YT);
        };
        let script = document.querySelector("script[data-focusforge-yt]");
        if (!script) {
          script = document.createElement("script");
          script.src = "https://www.youtube.com/iframe_api";
          script.async = true;
          script.dataset.focusforgeYt = "true";
          script.onerror = () => { if (!done) { done = true; clearTimeout(timer); reject(new Error("Không tải được YouTube IFrame API.")); } };
          document.head.append(script);
        }
      });
      return youtubeApiPromise;
    }
    function createHost(id) {
      const host = make("div", "audio-youtube-hidden-player");
      host.id = `ff-yt-${id.replace(/[^\w-]/g, "-")}-${Math.random().toString(36).slice(2)}`;
      $("#audio-youtube-player-host").append(host);
      playerHosts.set(id, host);
      return host;
    }
    function youtubeError() {
      if (!musicPlaybackRequested || playing?.source !== "youtube") return;
      const track = youtubeTrack(preferences.youtubeTrackId);
      if (!track) return;
      badYoutube.add(track.videoId);
      showToast(`Không thể phát (video bị xóa hoặc không cho nhúng): ${track.title}.`, true);
      renderYoutubeTracks();
      const next = youtubeNext(track.id, 1);
      if (next) void playYoutube(next.id, 1);
      else { musicPlaybackRequested = false; playing = null; updateMini(); }
    }
    function makeMusicPlayer(YT, track) {
      const host = createHost("music");
      musicVideoId = track.videoId;
      musicPlayer = new YT.Player(host.id, {
        width: 1, height: 1, videoId: track.videoId,
        playerVars: { autoplay: 0, controls: 0, disablekb: 1, playsinline: 1, rel: 0 },
        events: {
          onReady: (event) => {
            musicPlayerReady = true;
            event.target.setVolume(Math.round(preferences.musicVolume * 100));
            const selected = youtubeTrack(preferences.youtubeTrackId);
            if (musicPlaybackRequested && playing?.source === "youtube" && selected) {
              musicVideoId = selected.videoId;
              event.target.loadVideoById(selected.videoId);
            } else event.target.cueVideoById(musicVideoId);
          },
          onStateChange: (event) => {
            const states = YT.PlayerState;
            if (event.data === states.PLAYING && (!musicPlaybackRequested || playing?.source !== "youtube")) {
              event.target.pauseVideo();
              return;
            }
            if (event.data === states.PLAYING) {
              const selected = youtubeTrack(preferences.youtubeTrackId);
              const actualTitle = event.target.getVideoData()?.title;
              if (selected && actualTitle && !selected.customTitle) { selected.title = actualTitle.slice(0, 200); savePlaylist(); renderYoutubeTracks(); }
            }
            if (event.data === states.ENDED && musicPlaybackRequested && playing?.source === "youtube") skipMusic(1);
            renderYoutubeTracks();
            updateMini();
          },
          onError: youtubeError
        }
      });
    }
    async function playYoutube(id, direction = 1) {
      if (fileProtocol()) {
        $("#audio-youtube-warning").hidden = false;
        return showToast("Hãy mở bằng http://localhost để phát YouTube.", true);
      }
      let track = youtubeTrack(id);
      if (!track) return;
      if (badYoutube.has(track.videoId)) track = youtubeNext(id, direction);
      if (!track) return showToast("Không còn video YouTube nào có thể phát trong bộ lọc hiện tại.", true);
      musicPlaybackRequested = true;
      stopOtherMusic("youtube");
      preferences.source = "youtube";
      preferences.youtubeTrackId = track.id;
      playing = { source: "youtube", id: track.id };
      setSource("youtube");
      saveSettings();
      updateMini();
      try {
        const YT = await ensureYoutubeApi();
        if (!musicPlaybackRequested || playing?.source !== "youtube" || playing.id !== track.id) return;
        if (!musicPlayer) makeMusicPlayer(YT, track);
        else if (!musicPlayerReady) musicVideoId = track.videoId;
        else if (musicVideoId !== track.videoId) {
          musicVideoId = track.videoId;
          musicPlayer.loadVideoById(track.videoId);
        } else musicPlayer.playVideo();
      } catch (error) {
        if (!musicPlaybackRequested || playing?.source !== "youtube" || playing.id !== track.id) return;
        showToast(error.message || String(error), true);
        musicPlaybackRequested = false;
        playing = null;
        updateMini();
      }
    }
    function skipMusic(direction) {
      const current = playing || { source: preferences.source, id: preferences.source === "system" ? preferences.localTrackId : preferences.youtubeTrackId };
      const next = current.source === "system" ? localNext(current.id, direction) : youtubeNext(current.id, direction);
      if (!next) return;
      if (current.source === "system") void playLocal(next.id, direction);
      else void playYoutube(next.id, direction);
    }
    function playCurrent() {
      const current = playing || { source: preferences.source, id: preferences.source === "system" ? preferences.localTrackId : preferences.youtubeTrackId };
      if (current.source === "system") void playLocal(current.id);
      else void playYoutube(current.id);
    }
    function pauseMusic() {
      if (playing?.source === "system") localMusic.get(playing.id)?.pause();
      else if (playing?.source === "youtube") {
        musicPlaybackRequested = false;
        if (musicPlayerReady) musicPlayer.pauseVideo();
      }
      updateMini();
    }
    function renderLocalTracks() {
      const list = $("#audio-local-track-list");
      const tracks = preferences.filter === "all" ? LOCAL_TRACKS : LOCAL_TRACKS.filter((item) => item.category === preferences.filter);
      list.replaceChildren();
      if (!tracks.length) list.append(make("p", "audio-empty", "No tracks in this category yet."));
      tracks.forEach((track) => {
        const row = make("article", "audio-track");
        row.classList.toggle("is-current", preferences.localTrackId === track.id);
        const button = make("button", "button button-outline audio-track-play", playing?.source === "system" && playing.id === track.id && !localMusic.get(track.id)?.paused ? "Ⅱ" : "▶");
        button.type = "button";
        button.setAttribute("aria-label", `Phát ${track.title}`);
        const copy = make("div", "audio-track-copy");
        copy.append(make("strong", "", track.title), make("small", "", track.category));
        copy.append(make("small", `audio-track-status${badLocal.has(track.id) ? " is-error" : ""}`, badLocal.has(track.id) ? `Không phát được · kiểm tra ${track.src}` : track.artist));
        button.addEventListener("click", () => {
          if (playing?.source === "system" && playing.id === track.id && !localMusic.get(track.id).paused) pauseMusic();
          else void playLocal(track.id);
        });
        row.append(copy, button);
        list.append(row);
      });
    }
    function renderYoutubeTracks() {
      const list = $("#audio-youtube-track-list");
      list.replaceChildren();
      const tracks = playlist.filter((item) => youtubeFilter === "all" || item.category === youtubeFilter);
      if (!tracks.length) list.append(make("p", "audio-empty", "Paste a YouTube link above to add a track."));
      tracks.forEach((track) => {
        const row = make("article", "audio-track");
        row.classList.add("audio-track-youtube");
        row.classList.toggle("is-current", preferences.youtubeTrackId === track.id);
        const button = make("button", "button button-outline audio-track-play", playing?.source === "youtube" && playing.id === track.id && isMusicPlaying() ? "Ⅱ" : "▶");
        button.type = "button"; button.setAttribute("aria-label", `Play ${track.title}`);
        const copy = make("div", "audio-track-copy");
        copy.append(make("strong", "", track.title), make("small", "", track.category));
        copy.append(make("small", `audio-track-status${badYoutube.has(track.videoId) ? " is-error" : ""}`, badYoutube.has(track.videoId) ? "Không thể phát (video bị xóa hoặc không cho nhúng)" : "YouTube"));
        const actions = make("div", "audio-youtube-actions");
        const rename = make("button", "button button-outline audio-small-action", "Đổi tên");
        const remove = make("button", "button button-outline audio-small-action", "Xóa");
        rename.type = "button"; remove.type = "button";
        rename.setAttribute("aria-label", `Rename ${track.title}`); remove.setAttribute("aria-label", `Delete ${track.title}`);
        rename.addEventListener("click", () => {
          const value = prompt("Tên bài hát", track.title);
          if (value === null) return;
          if (!value.trim()) return showToast("Tên bài hát không được để trống.", true);
          track.title = value.trim().slice(0, 200); track.customTitle = true;
          savePlaylist(); renderYoutubeTracks(); updateMini();
        });
        remove.addEventListener("click", () => {
          if (playing?.source === "youtube" && playing.id === track.id) { pauseMusic(); playing = null; }
          playlist = playlist.filter((item) => item.id !== track.id);
          if (preferences.youtubeTrackId === track.id) preferences.youtubeTrackId = playlist[0]?.id || "";
          savePlaylist(); saveSettings(); renderYoutubeTracks(); updateMini();
        });
        button.addEventListener("click", () => {
          if (playing?.source === "youtube" && playing.id === track.id && isMusicPlaying()) pauseMusic();
          else void playYoutube(track.id);
        });
        actions.append(rename, remove); row.append(copy, actions, button); list.append(row);
      });
    }
    function setFilter(filter, source) {
      if (source === "system") preferences.filter = filter;
      else { youtubeFilter = filter; preferences.youtubeFilter = filter; }
      document.querySelectorAll(source === "system" ? "[data-audio-filter]" : "[data-youtube-filter]").forEach((button) => {
        const value = source === "system" ? button.dataset.audioFilter : button.dataset.youtubeFilter;
        button.classList.toggle("active", value === filter); button.setAttribute("aria-pressed", String(value === filter));
      });
      if (source === "system") renderLocalTracks(); else renderYoutubeTracks();
      saveSettings();
    }
    function addYoutube(event) {
      event.preventDefault();
      const input = $("#audio-youtube-url");
      const error = $("#audio-youtube-error");
      const videoId = extractYouTubeId(input.value);
      if (!videoId) { error.textContent = "Nhập URL YouTube hợp lệ hoặc mã video 11 ký tự."; input.setAttribute("aria-invalid", "true"); input.focus(); return; }
      if (playlist.some((item) => item.videoId === videoId)) { error.textContent = "Video này đã có trong danh sách."; input.setAttribute("aria-invalid", "true"); input.focus(); return; }
      error.textContent = ""; input.removeAttribute("aria-invalid");
      const category = $("#audio-youtube-category").value;
      const item = { id: `yt-${videoId}`, videoId, title: `YouTube video ${videoId}`, category, customTitle: false };
      playlist.push(item);
      if (!preferences.youtubeTrackId) preferences.youtubeTrackId = item.id;
      savePlaylist(); saveSettings(); input.value = ""; renderYoutubeTracks(); updateMini();
    }
    function moveSeek() {
      if (playing?.source === "system") {
        const audio = localMusic.get(playing.id);
        if (audio && Number.isFinite(audio.duration)) audio.currentTime = Number($("#audio-mini-seek").value);
      } else if (musicPlayerReady) musicPlayer.seekTo(Number($("#audio-mini-seek").value), true);
    }
    function setVolume(value) {
      preferences.musicVolume = value;
      localMusic.forEach((audio) => { audio.volume = value; });
      if (musicPlayerReady) musicPlayer.setVolume(Math.round(value * 100));
      saveSettings();
    }

    LOCAL_TRACKS.forEach((track) => {
      const audio = new Audio(new URL(track.src, document.baseURI).href); audio.preload = "none"; audio.volume = preferences.musicVolume;
      audio.addEventListener("play", () => { playing = { source: "system", id: track.id }; preferences.source = "system"; updateMini(); renderLocalTracks(); });
      audio.addEventListener("pause", () => { updateMini(); renderLocalTracks(); });
      audio.addEventListener("timeupdate", updateMini); audio.addEventListener("loadedmetadata", updateMini);
      audio.addEventListener("ended", () => { if (playing?.id === track.id) skipMusic(1); });
      audio.addEventListener("error", () => handleLocalError(track)); localMusic.set(track.id, audio);
    });
    $("#audio-music-volume").value = String(preferences.musicVolume);
    renderLocalTracks(); renderYoutubeTracks();
    setFilter(preferences.filter, "system");
    setFilter(preferences.youtubeFilter, "youtube");
    document.querySelectorAll("[data-audio-filter]").forEach((button) => button.addEventListener("click", () => setFilter(button.dataset.audioFilter, "system")));
    document.querySelectorAll("[data-youtube-filter]").forEach((button) => button.addEventListener("click", () => {
      youtubeFilter = button.dataset.youtubeFilter; setFilter(youtubeFilter, "youtube");
    }));
    document.querySelectorAll("[data-audio-source]").forEach((button) => {
      button.addEventListener("click", () => setSource(button.dataset.audioSource));
      button.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
        event.preventDefault(); const next = button.dataset.audioSource === "system" ? "youtube" : "system";
        setSource(next); $(`[data-audio-source="${next}"]`).focus();
      });
    });
    $("#audio-youtube-form").addEventListener("submit", addYoutube);
    $("#audio-youtube-url").addEventListener("input", () => { $("#audio-youtube-error").textContent = ""; $("#audio-youtube-url").removeAttribute("aria-invalid"); });
    $("#audio-widget-toggle").addEventListener("click", () => setOpen(!open));
    $("#audio-close").addEventListener("click", () => { setOpen(false); $("#audio-widget-toggle").focus(); });
    document.addEventListener("pointerdown", (event) => { if (open && !widget.contains(event.target) && !popover.contains(event.target)) setOpen(false); });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && open) {
        event.stopImmediatePropagation();
        setOpen(false);
        $("#audio-widget-toggle").focus();
      }
    });
    $("#audio-prev").addEventListener("click", () => skipMusic(-1));
    $("#audio-next").addEventListener("click", () => skipMusic(1));
    $("#audio-play").addEventListener("click", () => isMusicPlaying() ? pauseMusic() : playCurrent());
    $("#audio-mini-seek").addEventListener("input", moveSeek);
    $("#audio-music-volume").addEventListener("input", (event) => setVolume(Number(event.target.value)));
    $("#audio-youtube-warning").hidden = !fileProtocol();
    window.addEventListener("resize", placePopover); placePopover(); setSource(preferences.source);
    window.setInterval(() => updateMini(), 500);
    if ("mediaSession" in navigator) {
      [["play", playCurrent], ["pause", pauseMusic], ["previoustrack", () => skipMusic(-1)], ["nexttrack", () => skipMusic(1)]].forEach(([action, handler]) => {
        try { navigator.mediaSession.setActionHandler(action, handler); }
        catch (error) { if (error.name !== "NotSupportedError") showToast(`Không thể thiết lập phím media: ${error.message}`, true); }
      });
    }
    if ("mediaSession" in navigator) {
      try {
        navigator.mediaSession.setActionHandler("play", playCurrent);
        navigator.mediaSession.setActionHandler("pause", pauseMusic);
        navigator.mediaSession.setActionHandler("previoustrack", () => skipMusic(-1));
        navigator.mediaSession.setActionHandler("nexttrack", () => skipMusic(1));
      } catch (error) {
        if (error.name !== "NotSupportedError") showToast(`Không thể thiết lập phím media: ${error.message}`, true);
      }
    }
    updateMini();
  }

  function init() {
    if (window.focusForgeDesktop?.isDesktopApp) {
      $(".desktop-download-panel").hidden = true;
    }
    initAudioWidget();
    loadThemeStore();
    loadSoundSettings();
    applyTheme(allThemes().find((theme) => theme.id === themeStore.selectedId) || PRESET_THEMES[0]);
    $("#today-label").textContent = new Intl.DateTimeFormat("vi-VN", { weekday: "short", day: "numeric", month: "short" }).format(new Date());
    loadData();
    loadCalendarSchedules();
    state.calendarDate = localDate().slice(0, 7);
    state.selectedCalendarDate = localDate();
    state.observedDate = localDate();
    if (clockLooksChanged()) warnClockChange();
    state.data.dateCheckpoint = { date: state.observedDate, observedAt: new Date().toISOString() };
    saveData();
    const monotonicNow = window.performance?.now?.();
    state.clockSample = { wall: Date.now(), monotonic: Number.isFinite(monotonicNow) ? monotonicNow : null };
    applyDefaultDurationChoice();
    const requested = location.hash.slice(1);
    navigate(Object.hasOwn(PAGE_NAMES, requested) ? requested : "overview");
    if (reconcileXp()) saveData();
    bindEvents();
    renderAll();
    if (state.timer?.status === "pending-save") {
      openConfirm({
        title: state.timer.completionType === "completed" ? "Phiên Focus đã hoàn thành" : "Xác nhận phiên Focus",
        message: `Phiên "${state.timer.task}" có ${formatMinutes(state.timer.actualMs)} thời gian tập trung. Lưu phiên vào lịch sử?`,
        accept: "Lưu phiên",
        cancel: "Bỏ phiên",
        onAccept: savePendingSession,
        onCancel: discardPendingSession
      });
    }
    state.tickHandle = window.setInterval(() => {
      const today = localDate();
      if (today !== state.observedDate) {
        if (clockLooksChanged()) warnClockChange();
        state.observedDate = today;
        if (!Object.hasOwn(state.data.dailyTargets, today)) {
          state.data.dailyTargets[today] = state.data.settings.dailyGoalMinutes;
        }
        state.data.dateCheckpoint = { date: today, observedAt: new Date().toISOString() };
        saveData();
        $("#today-label").textContent = new Intl.DateTimeFormat("vi-VN", { weekday: "short", day: "numeric", month: "short" }).format(new Date());
        renderAll();
      }
      const wallNow = Date.now();
      const monotonicCurrent = window.performance?.now?.();
      if (state.clockSample?.monotonic !== null && Number.isFinite(monotonicCurrent)
        && Math.abs((wallNow - state.clockSample.wall) - (monotonicCurrent - state.clockSample.monotonic)) > 120000) warnClockChange();
      state.clockSample = { wall: wallNow, monotonic: Number.isFinite(monotonicCurrent) ? monotonicCurrent : null };
      if (state.timer?.status === "running") {
        if (Date.now() >= state.timer.phaseEndsAt) completeTimer();
        else renderTimer();
      }
    }, 500);
    window.addEventListener("beforeunload", () => {
      if (state.timer) saveTimer();
    });
    void initializeFirebaseAuth();
  }

  document.addEventListener("DOMContentLoaded", init, { once: true });
})();
