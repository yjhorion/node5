export default function (err, req, res, next) {
  console.error(err);

  res.status(500).json({ errorMessage: "서버 내부 에러가 발생했습니다" });
}

// 사실상 쓰이고 있지 않은 error handler //
