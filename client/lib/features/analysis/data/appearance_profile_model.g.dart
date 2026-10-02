// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'appearance_profile_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

AppearanceProfile _$AppearanceProfileFromJson(Map<String, dynamic> json) =>
    AppearanceProfile(
      faceShape: json['face_shape'] as String,
      hairType: json['hair_type'] as String,
      hairLength: json['hair_length'] as String,
      hairDensity: json['hair_density'] as String,
      hairFrizziness: json['hair_frizziness'] as String,
    );

Map<String, dynamic> _$AppearanceProfileToJson(AppearanceProfile instance) =>
    <String, dynamic>{
      'face_shape': instance.faceShape,
      'hair_type': instance.hairType,
      'hair_length': instance.hairLength,
      'hair_density': instance.hairDensity,
      'hair_frizziness': instance.hairFrizziness,
    };
