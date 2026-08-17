// api/ehadir.js
export default async function handler(req, res) {
  try {
    // Current date in Malaysia time (UTC+8)
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kuala_Lumpur",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    const todayStr = formatter.format(new Date()); // Outputs "2026-08-18"

    const studentsUrl = `https://parents.chsmelaka.com/api/proxy?target=${encodeURIComponent("https://chsmelaka.com/api/school/getStudents")}`;
    const attendanceUrl = `https://parents.chsmelaka.com/api/proxy?target=${encodeURIComponent(`https://chsmelaka.com/api/school/edatang/getAttendance?date=${todayStr}`)}`;

    const [studentsRes, attendanceRes] = await Promise.all([
      fetch(studentsUrl, { headers: { "User-Agent": "Mozilla/5.0" } }),
      fetch(attendanceUrl, { headers: { "User-Agent": "Mozilla/5.0" } })
    ]);

    const studentsData = studentsRes.ok ? await studentsRes.json() : [];
    const attendanceData = attendanceRes.ok ? await attendanceRes.json() : [];

    res.setHeader("Cache-Control", "s-maxage=15, stale-while-revalidate=30");
    res.setHeader("Access-Control-Allow-Origin", "*");

    return res.status(200).json({
      date: todayStr,
      students: Array.isArray(studentsData) ? studentsData : (studentsData.data || []),
      attendance: Array.isArray(attendanceData) ? attendanceData : (attendanceData.data || [])
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
