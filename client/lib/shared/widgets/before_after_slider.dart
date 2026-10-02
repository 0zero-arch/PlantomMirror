import 'package:flutter/material.dart';

/// 前后对比滑块（Phase 1 关键交互组件）。
///
/// 左侧露出 [before]，拖动分割线查看 [after]。
class BeforeAfterSlider extends StatefulWidget {
  const BeforeAfterSlider({
    super.key,
    required this.before,
    required this.after,
  });

  final Widget before;
  final Widget after;

  @override
  State<BeforeAfterSlider> createState() => _BeforeAfterSliderState();
}

class _BeforeAfterSliderState extends State<BeforeAfterSlider> {
  double _split = 0.5;

  @override
  Widget build(BuildContext context) {
    return AspectRatio(
      aspectRatio: 3 / 4,
      child: LayoutBuilder(
        builder: (context, constraints) {
          final w = constraints.maxWidth;
          final h = constraints.maxHeight;
          return GestureDetector(
            behavior: HitTestBehavior.opaque,
            onHorizontalDragUpdate: (d) {
              setState(() {
                _split = (_split + d.delta.dx / w).clamp(0.0, 1.0);
              });
            },
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Stack(
                children: [
                  Positioned.fill(child: widget.after),
                  ClipRect(
                    child: Align(
                      alignment: Alignment.centerLeft,
                      widthFactor: _split,
                      child: SizedBox(width: w, height: h, child: widget.before),
                    ),
                  ),
                  Positioned(
                    left: w * _split - 1,
                    top: 0,
                    bottom: 0,
                    child: const SizedBox(
                      width: 2,
                      child: ColoredBox(color: Colors.white),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
