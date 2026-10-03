// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'simulation_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Simulation _$SimulationFromJson(Map<String, dynamic> json) => Simulation(
  simulationId: json['simulationId'] as String,
  hairstyleId: json['hairstyleId'] as String,
  status: json['status'] as String,
  outputImageUrl: json['outputImageUrl'] as String?,
  error: json['error'] as String?,
);

Map<String, dynamic> _$SimulationToJson(Simulation instance) =>
    <String, dynamic>{
      'simulationId': instance.simulationId,
      'hairstyleId': instance.hairstyleId,
      'status': instance.status,
      'outputImageUrl': instance.outputImageUrl,
      'error': instance.error,
    };
