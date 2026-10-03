import 'package:json_annotation/json_annotation.dart';

part 'hairstyle_model.g.dart';

/// 发型目录项。字段名与后端 wire 格式一致（camelCase）。
@JsonSerializable()
class Hairstyle {
  const Hairstyle({
    required this.id,
    required this.code,
    required this.name,
    required this.category,
    required this.gender,
    required this.length,
    required this.texture,
    this.referenceImageUrl,
  });

  final String id;

  /// 稳定业务码（如 `m-buzz`）。比 uuid 更适合用来做样式分支或写日志。
  final String code;

  final String name;
  final String category;
  final String gender;
  final String length;
  final String texture;

  /// 参考图地址。当前种子数据里普遍为 null，所以必须可空 —— 写成非空会在
  /// 解析时直接抛异常，整个列表都加载不出来。
  final String? referenceImageUrl;

  factory Hairstyle.fromJson(Map<String, dynamic> json) =>
      _$HairstyleFromJson(json);

  Map<String, dynamic> toJson() => _$HairstyleToJson(this);
}