import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:phantom_mirror/app/app.dart';

void main() {
  testWidgets('首页渲染', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: PhantomMirrorApp()));
    await tester.pumpAndSettle();
    expect(find.text('幻境'), findsOneWidget);
    expect(find.text('让天下没有难变帅的人'), findsOneWidget);
  });
}
