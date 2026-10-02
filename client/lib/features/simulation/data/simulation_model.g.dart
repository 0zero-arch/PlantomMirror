// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'simulation_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Simulation _$SimulationFromJson(Map<String, dynamic> json) => Simulation(
  id: json['id'] as String,
  photoId: json['photo_id'] as String,
  hairstyleId: json['hairstyle_id'] as String,
  status: json['status'] as String,
  outputImage: json['output_image'] as String?,
);

Map<String, dynamic> _$SimulationToJson(Simulation instance) =>
    <String, dynamic>{
      'id': instance.id,
      'photo_id': instance.photoId,
      'hairstyle_id': instance.hairstyleId,
      'status': instance.status,
      'output_image': instance.outputImage,
    };
