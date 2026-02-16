export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            DeliveryCut AI
          </h1>
          <p className="text-xl text-gray-600">
            배달 대신 10분 한 끼
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <p className="text-gray-500 text-center">
            프로젝트 초기화 완료! 🎉
            <br />
            <code className="text-sm bg-gray-100 px-2 py-1 rounded mt-2 inline-block">
              npm install
            </code>
            {' '}명령어로 패키지를 설치해주세요.
          </p>
        </div>
      </div>
    </main>
  )
}
