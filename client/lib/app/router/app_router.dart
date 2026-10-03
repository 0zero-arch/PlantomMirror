import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/analysis/presentation/analysis_page.dart';
import '../../features/feedback/presentation/feedback_page.dart';
import '../../features/hairstyle/presentation/hairstyle_list_page.dart';
import '../../features/home/presentation/home_page.dart';
import '../../features/photo/presentation/photo_pick_page.dart';
import '../../features/photo/presentation/photo_preview_page.dart';
import '../../features/simulation/presentation/result_page.dart';
import '../../features/simulation/presentation/simulation_progress_page.dart';

/// go_router 路由表。
final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(path: '/', builder: (context, state) => const HomePage()),
      GoRoute(path: '/photo', builder: (context, state) => const PhotoPickPage()),
      GoRoute(
        path: '/photo/preview',
        builder: (context, state) =>
            PhotoPreviewPage(imagePath: state.extra as String?),
      ),
      GoRoute(
        path: '/analysis',
        builder: (context, state) =>
            AnalysisPage(photoId: state.uri.queryParameters['photoId']),
      ),
      GoRoute(
        path: '/hairstyle',
        builder: (context, state) =>
            HairstyleListPage(photoId: state.uri.queryParameters['photoId']),
      ),
      GoRoute(
        path: '/simulation/:hairstyleId',
        builder: (context, state) => SimulationProgressPage(
          hairstyleId: state.pathParameters['hairstyleId']!,
          photoId: state.uri.queryParameters['photoId'],
        ),
      ),
      GoRoute(
        path: '/result/:simulationId',
        builder: (context, state) =>
            ResultPage(simulationId: state.pathParameters['simulationId']!),
      ),
      GoRoute(
        path: '/feedback/:simulationId',
        builder: (context, state) =>
            FeedbackPage(simulationId: state.pathParameters['simulationId']!),
      ),
    ],
  );
});
