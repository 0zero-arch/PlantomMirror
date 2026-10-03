// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'appearance_profile_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

AppearanceProfile _$AppearanceProfileFromJson(Map<String, dynamic> json) =>
    AppearanceProfile(
      faceShape: json['faceShape'] as String,
      hairType: json['hairType'] as String,
      hairLength: json['hairLength'] as String,
      hairDensity: json['hairDensity'] as String,
      hairFrizziness: json['hairFrizziness'] as String,
    );

Map<String, dynamic> _$AppearanceProfileToJson(AppearanceProfile instance) =>
    <String, dynamic>{
      'faceShape': instance.faceShape,
      'hairType': instance.hairType,
      'hairLength': instance.hairLength,
      'hairDensity': instance.hairDensity,
      'hairFrizziness': instance.hairFrizziness,
    };
