// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'photo_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Photo _$PhotoFromJson(Map<String, dynamic> json) => Photo(
  id: json['id'] as String,
  storageKey: json['storage_key'] as String,
  type: json['type'] as String,
  width: (json['width'] as num).toInt(),
  height: (json['height'] as num).toInt(),
);

Map<String, dynamic> _$PhotoToJson(Photo instance) => <String, dynamic>{
  'id': instance.id,
  'storage_key': instance.storageKey,
  'type': instance.type,
  'width': instance.width,
  'height': instance.height,
};
