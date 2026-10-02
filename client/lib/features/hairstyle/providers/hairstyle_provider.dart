import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/hairstyle_api.dart';
import '../data/hairstyle_model.dart';

final hairstyleListProvider = FutureProvider<List<Hairstyle>>((ref) async {
  return ref.watch(hairstyleApiProvider).list();
});
