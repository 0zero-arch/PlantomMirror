import 'package:json_annotation/json_annotation.dart';

import '../../../core/utils/task_poller.dart';

part 'simulation_model.g.dart';

@JsonSerializable()
class Simulation {
  const Simulation({
    required this.id,
    required this.photoId,
    required this.hairstyleId,
    required this.status,
    this.outputImage,
  });

  final String id;

  @JsonKey(name: 'photo_id')
  final String photoId;

  @JsonKey(name: 'hairstyle_id')
  final String hairstyleId;

  /// wire 状态值（如 PROCESSING），用 [taskStatus] 转成枚举。
  final String status;

  @JsonKey(name: 'output_image')
  final String? outputImage;

  TaskStatus get taskStatus => TaskStatus.fromWire(status);

  factory Simulation.fromJson(Map<String, dynamic> json) =>
      _$SimulationFromJson(json);

  Map<String, dynamic> toJson() => _$SimulationToJson(this);
}
