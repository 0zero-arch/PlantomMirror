// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'hairstyle_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Hairstyle _$HairstyleFromJson(Map<String, dynamic> json) => Hairstyle(
  id: json['id'] as String,
  name: json['name'] as String,
  category: json['category'] as String,
  gender: json['gender'] as String,
  length: json['length'] as String,
  texture: json['texture'] as String,
  providerStyleId: json['provider_style_id'] as String,
  referenceImage: json['reference_image'] as String,
);

Map<String, dynamic> _$HairstyleToJson(Hairstyle instance) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
  'category': instance.category,
  'gender': instance.gender,
  'length': instance.length,
  'texture': instance.texture,
  'provider_style_id': instance.providerStyleId,
  'reference_image': instance.referenceImage,
};
