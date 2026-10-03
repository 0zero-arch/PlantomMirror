import 'package:json_annotation/json_annotation.dart';

import '../../../core/utils/task_poller.dart';

part 'simulation_model.g.dart';

/// 试戴任务。字段名与后端 wire 格式一致（camelCase）。
@JsonSerializable()
class Simulation {
  const Simulation({
    required this.simulationId,
    required this.hairstyleId,
    required this.status,
    this.outputImageUrl,
    this.error,
  });

  final String simulationId;
  final String hairstyleId;

  /// wire 状态值（如 PROCESSING），用 [taskStatus] 转成枚举。
  final String status;

  /// 成功后为结果图地址（带签名的临时 URL，有有效期）。
  final String? outputImageUrl;

  /// 失败原因，仅 FAILED 时有值。
  final String? error;

  TaskStatus get taskStatus => TaskStatus.fromWire(status);

  factory Simulation.fromJson(Map<String, dynamic> json) =>
      _$SimulationFromJson(json);

  Map<String, dynamic> toJson() => _$SimulationToJson(this);
}