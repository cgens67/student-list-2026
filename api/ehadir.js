// api/ehadir.js
export default async function handler(req, res) {
  try {
    const { date } = req.query;

    let targetDate = date;
    if (!targetDate) {
      const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kuala_Lumpur",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      });
      targetDate = formatter.format(new Date());
    }

    const fetchWithTimeout = async (url, ms = 4000) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), ms);
      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
        });
        clearTimeout(id);
        if (!response.ok) return null;
        return await response.json();
      } catch (e) {
        clearTimeout(id);
        return null;
      }
    };

    const studentsUrl = `https://parents.chsmelaka.com/api/proxy?target=${encodeURIComponent("https://chsmelaka.com/api/school/getStudents")}`;
    const attendanceUrl = `https://parents.chsmelaka.com/api/proxy?target=${encodeURIComponent(`https://chsmelaka.com/api/school/edatang/getAttendance?date=${targetDate}`)}`;
    
    // Fetch students, attendance, and staff in parallel
    const [studentsData, attendanceData, staffDataDirect, staffDataProxy] = await Promise.all([
      fetchWithTimeout(studentsUrl),
      fetchWithTimeout(attendanceUrl),
      fetchWithTimeout("https://www.chsmelaka.com/api/school/getStaff"),
      fetchWithTimeout(`https://parents.chsmelaka.com/api/proxy?target=${encodeURIComponent("https://www.chsmelaka.com/api/school/getStaff")}`)
    ]);

    const normalize = (data) => {
      if (!data) return [];
      if (Array.isArray(data)) return data;
      if (Array.isArray(data.data)) return data.data;
      if (Array.isArray(data.staff)) return data.staff;
      if (Array.isArray(data.result)) return data.result;
      return [];
    };

    const students = normalize(studentsData);
    const attendance = normalize(attendanceData);
    const staff = normalize(staffDataDirect).length > 0 ? normalize(staffDataDirect) : normalize(staffDataProxy);

    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");
    res.setHeader("Access-Control-Allow-Origin", "*");

    return res.status(200).json({
      date: targetDate,
      students,
      attendance,
      staff
    });
  } catch (error) {
    return res.status(500).json({ error: error.message, students: [], attendance: [], staff: [] });
  }
}
