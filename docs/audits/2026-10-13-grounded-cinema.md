# Grounded company cinema — 13 October 2026

IDEAL / 5Ws: a viewer watching the original company tale in either language and either aspect ratio must see the company walking on the authored road. Screen-relative placement previously left feet on roofs or over the distant valley; flattening a translucent shadow before compositing produced an opaque oval. Identify the source ground, define one camera transform, explore conservative staging, act on projection and compositing, then inspect native frames.

Twenty candidates considered: (1) shared scenery/actor projection; (2) source road feet; (3) camera-relative scale; (4) trimmed transparent sprite padding; (5) alpha contact shadows; (6) planted pole; (7) woven cloth; (8) foreground depth ordering; (9) empty establishing view; (10) empty distant-valley view; (11) portrait-safe trio spacing; (12) grounded thumbnail staging; (13) remove synthetic leaf ovals; (14) retain authored foreground; (15) introduce new backgrounds; (16) generate new people; (17) rewrite story; (18) add effects bursts; (19) new player controls; (20) change save schema. Selected 1–14; rejected 15–20 as unnecessary identity or scope changes.

Two genuine visual correction passes: first the shared source projection and shadows; then the native-frame findings (portrait trio clipped at the edge, flat flag, synthetic leaf ovals, and ungrounded thumbnail staging). These are two passes, not a claim of hundreds of iterations.

Both renderers now share source-space camera projection and company placement. Ground feet lie at source y880–980 on the authored open road; actor height follows camera scale. Establishing and valley shots carry no characters. Soft shadows are alpha-composited before RGB conversion. The standard has a planted outlined pole, base shadow, woven surface and restrained fold light. The original painted foreground replaces the added flat ellipse leaves. Thumbnails use the same ground camera.

Evidence: 24 native-sized PNGs at `/tmp/moh-ground/{portrait,wide}-{en,ar}-{5,15,25,35,45,55}.png`, all viewed. Corrected English thumbnail viewed. Root independently inspected wide15/55, accepted footing and requested the subsequent cloth/pole pass; that adjusted frame was viewed again. This is rendered-frame evidence, not physical-device playback acceptance.

`python -m unittest discover -s film -p 'test_*.py'`: 3 passed. Checks exercise both camera formats through start/mid/end company shots, source road limits and height scaling, empty unsupported shots, and a pixel sample proving the shadow retains ground color. Initial assertion exposed only floating-point roundoff (330.00000000000006); the strict limit now allows 0.000001 tolerance.

Four complete movies and their manifests are regenerating from this final source. Final encode metadata/decode verification will be appended when complete. Runtime UI and save formats are unchanged by this cinema correction.
