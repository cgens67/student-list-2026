// api/ehadir.js
export default async function handler(req, res) {
  try {
    const { date } = req.query;

    // Use requested date or Malaysia's current date (UTC+8)
    let targetDate = date;
    if (!targetDate) {
      const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kuala_Lumpur",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      });
      targetDate = formatter.format(new Date()); // e.g. "2026-08-18"
    }

    const studentsUrl = `https://parents.chsmelaka.com/api/proxy?target=${encodeURIComponent("https://chsmelaka.com/api/school/getStudents")}`;
    const attendanceUrl = `https://parents.chsmelaka.com/api/proxy?target=${encodeURIComponent(`https://chsmelaka.com/api/school/edatang/getAttendance?date=${targetDate}`)}`;

    const [studentsRes, attendanceRes] = await Promise.all([
      fetch(studentsUrl, { headers: { "User-Agent": "Mozilla/5.0" } }),
      fetch(attendanceUrl, { headers: { "User-Agent": "Mozilla/5.0" } })
    ]);

    const students = studentsRes.ok ? await studentsRes.json() : [];
    const attendance = attendanceRes.ok ? await attendanceRes.json() : [];

    res.setHeader("Cache-Control", "s-maxage=15, stale-while-revalidate=30");
    res.setHeader("Access-Control-Allow-Origin", "*");

    return res.status(200).json({
      date: targetDate,
      students: Array.isArray(students) ? students : (students.data || []),
      attendance: Array.isArray(attendance) ? attendance : (attendance.data || [])
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
