/// 接口路径常量（后端 REST）。
class ApiEndpoints {
  ApiEndpoints._();

  // 照片上传（Presigned URL 直传对象存储）
  static const uploadUrl = '/photos/upload-url';
  static String photoComplete(String photoId) => '/photos/$photoId/complete';

  // 分析
  static const analysis = '/analysis';
  static String analysisTask(String taskId) => '/analysis/$taskId';

  // 发型
  static const hairstyles = '/hairstyles';

  // 模拟
  static const simulations = '/simulations';
  static String simulation(String simulationId) => '/simulations/$simulationId';

  // 反馈
  static const feedback = '/feedback';
}
