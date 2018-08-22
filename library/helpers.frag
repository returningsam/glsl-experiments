vec2 rotateAroundPoint(vec2 point, vec2 center, float angle) {
    float x = center.x + (point.x-center.x)*cos(angle) - (point.y-center.y)*sin(angle);
    float y = center.y + (point.x-center.x)*sin(angle) + (point.y-center.y)*cos(angle);
    return vec2(x,y);
}
